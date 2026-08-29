import argparse
import csv
import os
import random
import re
import time
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


# ============================================================
# 配置
# ============================================================

PAGE_URL = "https://chinese.yabla.com/chinese-pinyin-chart.php"

AUDIO_BASE = (
    "https://s3.amazonaws.com/"
    "media.yabla.com/chinese_static/audio/alicia/"
)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yabla_mp3")

# Yabla 拼音表使用四声
TONES = (1, 2, 3, 4)

# 当前核对到的网页音节总数
EXPECTED_SYLLABLE_COUNT = 407

# 请求超时
TIMEOUT = 20

# 下载失败后的重试次数
MAX_RETRIES = 3

# 每次请求之间稍微停顿
REQUEST_DELAY_MIN = 0.08
REQUEST_DELAY_MAX = 0.15


# ============================================================
# 基础设置
# ============================================================

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/139.0 Safari/537.36"
    ),
    "Accept": "*/*",
}


class TableParser(HTMLParser):
    """提取顶层 HTML 表格的纯文本单元格。"""

    def __init__(self):
        super().__init__()
        self.tables = []
        self.table_depth = 0
        self.table = None
        self.row = None
        self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            if self.table_depth == 0:
                self.table = []
            self.table_depth += 1
        elif self.table_depth == 1 and tag == "tr":
            self.row = []
        elif self.table_depth == 1 and tag in ("td", "th") and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if self.table_depth == 1 and tag in ("td", "th") and self.cell is not None:
            self.row.append("".join(self.cell).strip())
            self.cell = None
        elif self.table_depth == 1 and tag == "tr" and self.row is not None:
            self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table_depth:
            self.table_depth -= 1
            if self.table_depth == 0:
                self.tables.append(self.table)
                self.table = None


# ============================================================
# 获取 Yabla 当前拼音表
# ============================================================

def get_syllables():
    """
    从当前 Yabla 页面读取完整拼音表。

    提取范围：
    - 无声母音节：a / ai / er / yi / wu / yu ...
    - b/p/m/f...
    - 一直到 x 行

    不把独立声母 b/p/m 等作为音节。
    """

    print("正在读取 Yabla 拼音表...")
    print(PAGE_URL)
    print()

    request = Request(PAGE_URL, headers=HEADERS)
    with urlopen(request, timeout=TIMEOUT) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        html = response.read().decode(charset, errors="replace")

    parser = TableParser()
    parser.feed(html)
    tables = parser.tables

    if not tables:
        raise RuntimeError("没有从网页中读取到任何表格。")

    # 选择同时包含 b、x 行的最大表格，避免误选页面布局表格。
    candidates = []
    for table in tables:
        first_col = [row[0].strip().lower() if row else "" for row in table]
        if "b" in first_col and "x" in first_col:
            candidates.append((table, first_col))

    if not candidates:
        raise RuntimeError("没有在页面表格中找到同时包含 b、x 的拼音表。")

    table, first_col = max(
        candidates,
        key=lambda item: sum(len(row) for row in item[0])
    )

    b_rows = [i for i, value in enumerate(first_col) if value == "b"]
    x_rows = [i for i, value in enumerate(first_col) if value == "x"]

    if not b_rows:
        raise RuntimeError("没有在页面表格中找到 b 行。")

    if not x_rows:
        raise RuntimeError("没有在页面表格中找到 x 行。")

    # b 上面一行是无声母音节行
    # 包含 a / ai / ao / er / yi / wu / yu 等
    start_row = b_rows[0] - 1
    end_row = x_rows[-1]

    body = table[start_row:end_row + 1]

    syllables = set()

    for row in body:

        # 第一列是声母名称，所以跳过
        for raw_value in row[1:]:

            value = str(raw_value).strip().lower()

            if not value:
                continue

            # 只保留拼音字母
            if re.fullmatch(r"[a-zü]+", value):
                syllables.add(value)

    syllables = sorted(syllables)

    return syllables


# ============================================================
# Yabla 文件名转换
# ============================================================

def server_spelling(pinyin):
    """
    将页面中的拼音转换成服务器实际文件名。

    已确认：
        nü  -> nv
        nüe -> nve
        lü  -> lv

    因此统一执行：
        ü -> v

    例如：
        nüe -> nve
        lüe -> lve

    ju / jue / juan / jun
    qu / que / quan / qun
    xu / xue / xuan / xun

    保持原样。
    """

    return pinyin.replace("ü", "v")


# ============================================================
# 判断返回内容是否确实是 MP3
# ============================================================

def is_real_mp3(data):
    """
    防止 S3 返回 XML / HTML 错误页面却被保存成 .mp3。
    """

    if len(data) < 100:
        return False

    # ID3 标签
    if data.startswith(b"ID3"):
        return True

    # MPEG Audio Frame Sync。ponytail: 这里只做轻量签名检查；需要严格解码校验时接 ffprobe。
    if len(data) >= 2:

        if (
            data[0] == 0xFF
            and (data[1] & 0xE0) == 0xE0
        ):
            return True

    return False


# ============================================================
# 单文件下载
# ============================================================

def download_audio(pinyin, tone):
    """
    下载一个指定音节 + 声调。
    """

    server_name = server_spelling(pinyin)

    filename = f"{server_name}{tone}.mp3"

    # URL 中没有特殊字符了，因为 ü 已经转换成 v
    url = AUDIO_BASE + quote(filename)

    output_path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    # 已经存在且确实带有 MP3 签名才跳过。
    if os.path.exists(output_path):

        size = os.path.getsize(output_path)

        with open(output_path, "rb") as f:
            existing_data = f.read(4096)

        if size > 100 and is_real_mp3(existing_data):

            return {
                "success": True,
                "pinyin": pinyin,
                "tone": tone,
                "server_name": server_name,
                "filename": filename,
                "url": url,
                "status": "existing",
                "size": size,
                "http_status": 200,
            }

    last_error = ""
    last_status = ""

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            request = Request(url, headers=HEADERS)
            with urlopen(request, timeout=TIMEOUT) as response:
                last_status = response.status
                content_type = response.headers.get("Content-Type", "")
                data = response.read()

            if last_status == 200 and is_real_mp3(data):
                temporary_path = output_path + ".part"
                with open(temporary_path, "wb") as f:
                    f.write(data)
                os.replace(temporary_path, output_path)

                return {
                    "success": True,
                    "pinyin": pinyin,
                    "tone": tone,
                    "server_name": server_name,
                    "filename": filename,
                    "url": url,
                    "status": "downloaded",
                    "size": len(data),
                    "http_status": last_status,
                }

            last_error = (
                f"HTTP {last_status}, "
                f"Content-Type={content_type}, 内容不是有效 MP3"
            )

        except HTTPError as e:
            last_status = e.code
            last_error = f"HTTP {e.code}"
            if e.code == 404:
                break

        except (URLError, TimeoutError, OSError) as e:

            last_error = str(e)

        if attempt < MAX_RETRIES:
            time.sleep(0.5 * attempt)

    return {
        "success": False,
        "pinyin": pinyin,
        "tone": tone,
        "server_name": server_name,
        "filename": filename,
        "url": url,
        "status": "failed",
        "size": 0,
        "http_status": last_status,
        "error": last_error,
    }


# ============================================================
# 保存 CSV
# ============================================================

def save_csv(filename, rows, fields):

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    with open(
        path,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fields,
            extrasaction="ignore"
        )

        writer.writeheader()
        writer.writerows(rows)

    return path


# ============================================================
# 主程序
# ============================================================

def main():

    argument_parser = argparse.ArgumentParser(
        description="下载 Yabla 拼音表中的四声音频。请先确认你有权下载和使用这些音频。"
    )
    argument_parser.add_argument(
        "--check",
        action="store_true",
        help="只检查网页解析和音节数量，不下载音频",
    )
    args = argument_parser.parse_args()

    print("=" * 70)
    print("Yabla Chinese Pinyin Audio Downloader")
    print("=" * 70)
    print()

    # --------------------------------------------------------
    # 读取拼音表
    # --------------------------------------------------------

    syllables = get_syllables()

    print(f"网页中提取到音节：{len(syllables)} 个")
    print()

    # --------------------------------------------------------
    # 完整性检查
    # --------------------------------------------------------

    if len(syllables) != EXPECTED_SYLLABLE_COUNT:

        print("!" * 70)
        print("警告：拼音表数量与当前核对结果不一致。")
        print()
        print(
            f"当前提取：{len(syllables)}"
        )
        print(
            f"核对基准：{EXPECTED_SYLLABLE_COUNT}"
        )
        print()
        print(
            "Yabla 页面内容或 HTML 结构可能发生变化。"
        )
        print(
            "为避免漏下载，程序停止。"
        )
        print("!" * 70)

        raise RuntimeError("拼音表完整性检查失败。")

    print(
        f"[OK] 完整性检查通过："
        f"{len(syllables)}/{EXPECTED_SYLLABLE_COUNT}"
    )

    print()

    if args.check:
        print("检查完成，未下载音频。")
        return

    print("请确认你已获得 Yabla 对相应用途的下载和使用许可。")
    print()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 输出音节列表，方便人工检查
    syllable_txt = os.path.join(
        OUTPUT_DIR,
        "_syllables.txt"
    )

    with open(
        syllable_txt,
        "w",
        encoding="utf-8"
    ) as f:

        for syllable in syllables:
            f.write(syllable + "\n")

    print("音节列表：")
    print(", ".join(syllables))
    print()

    # --------------------------------------------------------
    # 输出 ü -> v 映射
    # --------------------------------------------------------

    special = [
        x
        for x in syllables
        if "ü" in x
    ]

    if special:

        print("特殊文件名转换：")

        for p in special:
            print(
                f"  {p} -> "
                f"{server_spelling(p)}"
            )

        print()

    # --------------------------------------------------------
    # 下载
    # --------------------------------------------------------

    total = len(syllables) * len(TONES)

    print(
        f"候选音频总数："
        f"{len(syllables)} × {len(TONES)} "
        f"= {total}"
    )
    print()

    print("开始验证并下载...")
    print()

    success_rows = []
    failed_rows = []

    current = 0

    for pinyin in syllables:

        for tone in TONES:

            current += 1

            server_name = server_spelling(pinyin)
            filename = f"{server_name}{tone}.mp3"

            print(
                f"[{current:4d}/{total}] "
                f"{pinyin}{tone:<2} "
                f"-> {filename:<15}",
                end=""
            )

            result = download_audio(
                pinyin,
                tone
            )

            if result["success"]:

                success_rows.append(result)

                if result["status"] == "existing":
                    print(
                        f" 已存在 "
                        f"({result['size']} bytes)"
                    )
                else:
                    print(
                        f" [OK] "
                        f"({result['size']} bytes)"
                    )

            else:

                failed_rows.append(result)

                print(
                    f" [FAIL] "
                    f"HTTP {result['http_status']}"
                )

            time.sleep(
                random.uniform(
                    REQUEST_DELAY_MIN,
                    REQUEST_DELAY_MAX
                )
            )

    # --------------------------------------------------------
    # 保存成功记录
    # --------------------------------------------------------

    success_csv = save_csv(
        "_success.csv",
        success_rows,
        [
            "pinyin",
            "tone",
            "server_name",
            "filename",
            "url",
            "status",
            "size",
            "http_status",
        ]
    )

    # --------------------------------------------------------
    # 保存失败记录
    # --------------------------------------------------------

    failed_csv = save_csv(
        "_failed.csv",
        failed_rows,
        [
            "pinyin",
            "tone",
            "server_name",
            "filename",
            "url",
            "status",
            "http_status",
            "error",
        ]
    )

    # --------------------------------------------------------
    # 单独输出失败 URL TXT
    # --------------------------------------------------------

    failed_txt = os.path.join(
        OUTPUT_DIR,
        "_failed_urls.txt"
    )

    with open(
        failed_txt,
        "w",
        encoding="utf-8"
    ) as f:

        for row in failed_rows:
            f.write(
                row["url"] + "\n"
            )

    # --------------------------------------------------------
    # 输出最终结果
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("完成")
    print("=" * 70)

    print(
        f"拼音音节：{len(syllables)}"
    )

    print(
        f"候选音频：{total}"
    )

    print(
        f"成功/已存在：{len(success_rows)}"
    )

    print(
        f"不存在/失败：{len(failed_rows)}"
    )

    print()

    print(
        "MP3 保存位置："
    )
    print(
        os.path.abspath(OUTPUT_DIR)
    )

    print()

    print(
        "完整音节列表：",
        syllable_txt
    )

    print(
        "成功清单：",
        success_csv
    )

    print(
        "失败清单：",
        failed_csv
    )

    print(
        "失败 URL：",
        failed_txt
    )

    # --------------------------------------------------------
    # 对特殊 ü 音节做结果汇总
    # --------------------------------------------------------

    print()
    print("特殊 ü 音节检查：")

    for pinyin in special:

        server_name = server_spelling(pinyin)

        found = [
            row["filename"]
            for row in success_rows
            if row["pinyin"] == pinyin
        ]

        print(
            f"{pinyin:4} -> "
            f"{server_name:4} : "
            f"{', '.join(found) if found else '没有找到音频'}"
        )

    print()
    print("请重点检查 _failed.csv。")


if __name__ == "__main__":
    main()
