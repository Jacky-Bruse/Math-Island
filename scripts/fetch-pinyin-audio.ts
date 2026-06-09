// 拼音音频获取 / 校验脚本（hugolpz/audio-cmn，CC-by-sa）
// 运行：npx tsx scripts/fetch-pinyin-audio.ts        下载并生成合法音节表
//      npx tsx scripts/fetch-pinyin-audio.ts --check 仅校验（缺失则退出码 1，CI 用）
//
// 思路：一次拉取仓库 git tree 得到 syllabs/hsk 全部文件名集合 → 本地判存在
//  → 校验呼读音/代表音/整体认读/例字（缺失报告）
//  → 由 21 声母 × 韵母 生成本课程合法拼读 base 集（依音频存在性）
//  → 下载所需子集到 public/audio/cmn/，写入 generated 表 + LICENSE/NOTICE。

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  INITIALS, FINALS, WHOLE_SYLLABLES, EXAMPLE_WORDS, BLEND_INITIALS, BLEND_FINALS,
} from '../src/lib/pinyin-data'
import { blendBase, toAudioKey } from '../src/lib/pinyin-orthography'
import { VALID_BLEND_SYLLABLES } from '../src/lib/pinyin-syllables.generated'
import type { Tone } from '../src/types/pinyin'

// 规范化为可比较字符串（按 base 排序），用于检测 generated 表漂移
function canonEntries(entries: Array<[string, number[]]>): string {
  return JSON.stringify(
    entries.map(([k, v]) => [k, [...v]] as const).sort((a, b) => (a[0] < b[0] ? -1 : 1)),
  )
}

const REPO = 'hugolpz/audio-cmn'
const RAW = `https://raw.githubusercontent.com/${REPO}/master`
const OUT = path.resolve('public/audio/cmn')
const TONES: Tone[] = [1, 2, 3, 4]
const CHECK_ONLY = process.argv.includes('--check')

async function fetchTree(): Promise<{ syllabs: Set<string>; hsk: Set<string> }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/master?recursive=1`, {
    headers: { 'User-Agent': 'math-island', Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`拉取仓库 tree 失败：HTTP ${res.status}`)
  const data = (await res.json()) as { tree?: Array<{ path?: string }> }
  const syllabs = new Set<string>()
  const hsk = new Set<string>()
  for (const node of data.tree ?? []) {
    const p = node.path
    if (typeof p !== 'string') continue
    let m = p.match(/^64k\/syllabs\/cmn-(.+)\.mp3$/)
    if (m) { syllabs.add(m[1]); continue }
    m = p.match(/^64k\/hsk\/cmn-(.+)\.mp3$/)
    if (m) hsk.add(m[1])
  }
  return { syllabs, hsk }
}

interface DownloadItem { url: string; out: string }

async function downloadAll(items: DownloadItem[], concurrency = 16): Promise<void> {
  let i = 0
  let done = 0
  let skipped = 0
  async function worker() {
    while (i < items.length) {
      const item = items[i++]
      if (existsSync(item.out)) { skipped++; continue }
      const res = await fetch(item.url, { headers: { 'User-Agent': 'math-island' } })
      if (!res.ok) { console.error(`  ✗ 下载失败 ${res.status}: ${item.url}`); continue }
      const buf = Buffer.from(await res.arrayBuffer())
      await writeFile(item.out, buf)
      done++
      if (done % 100 === 0) console.log(`  …已下载 ${done}`)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  console.log(`  下载 ${done}，跳过(已存在) ${skipped}`)
}

async function main() {
  console.log('拉取 audio-cmn 仓库文件清单…')
  const { syllabs, hsk } = await fetchTree()
  console.log(`syllabs 库 ${syllabs.size} 个，hsk 库 ${hsk.size} 个`)

  // 课程硬引用：呼读音 / 代表音 / 整体认读（必须存在）
  const curated = new Map<string, string>()
  for (const ini of INITIALS) curated.set(ini.audioSyllable, `声母 ${ini.id}`)
  for (const fin of FINALS) curated.set(fin.audioRepresentative, `韵母 ${fin.displayFinal}`)
  for (const w of WHOLE_SYLLABLES) curated.set(w.audioKey, `整体认读 ${w.syllable}`)

  const missingCurated: Array<[string, string]> = []
  for (const [stem, label] of curated) {
    if (!syllabs.has(stem)) {
      // 给出同 base 其它声调的可用建议
      const base = stem.replace(/[1-4]$/, '')
      const alt = TONES.map(t => `${base}${t}`).filter(s => syllabs.has(s))
      missingCurated.push([stem, `${label}（建议改用：${alt.join('/') || '无'}）`])
    }
  }

  // 拼读：生成 base → 可用声调 映射（依音频存在性，逐声调判定）
  const baseTones = new Map<string, number[]>()
  const blendStems = new Set<string>()
  for (const ini of BLEND_INITIALS) {
    for (const fin of BLEND_FINALS) {
      const base = blendBase(ini.id, fin.canonicalFinal)
      const tones: number[] = []
      for (const t of TONES) {
        const stem = toAudioKey(base, t)
        if (syllabs.has(stem)) { blendStems.add(stem); tones.push(t) }
      }
      if (tones.length) baseTones.set(base, tones)
    }
  }
  const validBases = baseTones

  // 例字（单字音频 cmn-{hanzi}.mp3）
  const exampleNeeded: string[] = []
  const missingExamples: string[] = []
  for (const w of EXAMPLE_WORDS) {
    if (hsk.has(w.hanzi)) exampleNeeded.push(w.hanzi)
    else missingExamples.push(`${w.hanzi} (${w.pinyin})`)
  }

  console.log(`合法拼读 base ${validBases.size}，拼读音节文件 ${blendStems.size}`)
  console.log(`例字命中 ${exampleNeeded.length}/${EXAMPLE_WORDS.length}`)

  if (missingCurated.length) {
    console.error(`\n⚠ 缺失的呼读音/代表音/整体认读（${missingCurated.length}）：`)
    for (const [stem, label] of missingCurated) console.error(`  ✗ cmn-${stem}.mp3 — ${label}`)
  }
  if (missingExamples.length) {
    console.error(`\n⚠ 例字无单字音频（自动剔除，不阻塞，${missingExamples.length}）：`)
    for (const w of missingExamples) console.error(`  ✗ ${w}`)
  }

  // 仅“呼读音/代表音/整体认读”为硬引用；例字缺失自动剔除
  const hardMissing = missingCurated.length

  if (CHECK_ONLY) {
    const localProblems: string[] = []

    // (b) generated 表是否与脚本当前输出一致（防漂移）
    const computed = canonEntries([...baseTones.entries()])
    const committed = canonEntries(Object.entries(VALID_BLEND_SYLLABLES))
    if (computed !== committed) {
      localProblems.push('src/lib/pinyin-syllables.generated.ts 与脚本输出不一致（请重跑 npm run fetch-audio）')
    }

    // (a) generated/课程引用的音频在本地 public/audio/cmn 是否齐全
    const needStems = new Set<string>([...curated.keys(), ...blendStems].filter(s => syllabs.has(s)))
    for (const s of needStems) {
      if (!existsSync(path.join(OUT, 'syllabs', `cmn-${s}.mp3`))) localProblems.push(`本地缺音节 cmn-${s}.mp3`)
    }
    for (const h of exampleNeeded) {
      if (!existsSync(path.join(OUT, 'hsk', `cmn-${h}.mp3`))) localProblems.push(`本地缺例字 cmn-${h}.mp3`)
    }

    if (localProblems.length) {
      console.error(`\n⚠ 本地一致性问题（${localProblems.length}）：`)
      for (const p of localProblems.slice(0, 20)) console.error(`  ✗ ${p}`)
      if (localProblems.length > 20) console.error(`  …（共 ${localProblems.length} 项）`)
    }

    const total = hardMissing + localProblems.length
    console.log(total ? `\n校验未通过：${total} 处问题` : '\n校验通过：零缺失、本地一致')
    process.exit(total ? 1 : 0)
  }

  // 写入生成的合法音节表：base → 可用声调（逐声调判定，避免 UI 放出无音频的声调）
  const sortedEntries = [...baseTones.entries()].sort(([a], [b]) => a.localeCompare(b))
  const mapLines = sortedEntries.map(([b, ts]) => `  ${JSON.stringify(b)}: [${ts.join(', ')}],`).join('\n')
  const generated = `// 【自动生成】由 scripts/fetch-pinyin-audio.ts 依 audio-cmn 音频存在性生成，请勿手改。
// 本课程目标音节表：无调正写 base（ü 保留为 ü）→ 实际有录音的声调列表。共 ${sortedEntries.length} 个。

export const VALID_BLEND_SYLLABLES: Record<string, number[]> = {
${mapLines}
}
`
  await writeFile(path.resolve('src/lib/pinyin-syllables.generated.ts'), generated, 'utf8')
  console.log(`已写入 src/lib/pinyin-syllables.generated.ts（${sortedEntries.length} base）`)

  // 下载
  await mkdir(path.join(OUT, 'syllabs'), { recursive: true })
  await mkdir(path.join(OUT, 'hsk'), { recursive: true })

  const syllabStems = new Set<string>([...curated.keys(), ...blendStems].filter(s => syllabs.has(s)))
  console.log(`\n下载音节文件（${syllabStems.size}）…`)
  await downloadAll([...syllabStems].map(s => ({
    url: `${RAW}/64k/syllabs/cmn-${s}.mp3`,
    out: path.join(OUT, 'syllabs', `cmn-${s}.mp3`),
  })))

  console.log(`下载例字文件（${exampleNeeded.length}）…`)
  await downloadAll(exampleNeeded.map(h => ({
    url: `${RAW}/64k/hsk/cmn-${encodeURIComponent(h)}.mp3`,
    out: path.join(OUT, 'hsk', `cmn-${h}.mp3`),
  })))

  // LICENSE / NOTICE（CC-by-sa 署名义务）
  await writeFile(path.join(OUT, 'NOTICE.txt'),
    `本目录音频来自 ${REPO}（https://github.com/${REPO}），授权 CC BY-SA。\n` +
    `发音人：Chen Wang（音节）、Yue Tan（词）；项目方：Hugo Lopez、Nicolas Vion。\n` +
    `音频原样使用、未经二次剪辑。许可证全文见 LICENSE-CC-BY-SA.txt。\n`, 'utf8')
  await writeFile(path.join(OUT, 'LICENSE-CC-BY-SA.txt'),
    `Audio files in this directory are licensed under Creative Commons Attribution-ShareAlike (CC BY-SA).\n` +
    `Source: https://github.com/${REPO}\nLicense: https://creativecommons.org/licenses/by-sa/4.0/\n`, 'utf8')

  console.log(`\n完成${hardMissing ? `（但有 ${hardMissing} 处硬引用缺失，请修数据后重跑）` : ''}。`)
  if (hardMissing) process.exit(1)
}

main().catch(err => { console.error(err); process.exit(1) })
