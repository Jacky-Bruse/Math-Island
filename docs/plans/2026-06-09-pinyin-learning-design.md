# 拼音学习模块设计方案（拼音岛）

## Context（背景与目标）

数力岛（Math-Island）目前有 4 个学习模块（算术 / 比大小 / 数独 / 古诗），缺少语文启蒙内容。本方案新增第 5 个顶层模块 **"拼音岛"**，面向低龄儿童，按**循序渐进**的顺序教学：

1. **认字母**：先认识声母 / 韵母 / 声调及其发音
2. **拼读**：把声母 + 韵母 + 声调拼合成音节，听整体读音
3. **汉字联系**：把音节与例字 / 词关联，做"听音认字"的认读练习

音频采用 **hugolpz/audio-cmn**（真人录音，含音节 + 大量 HSK 汉字/词；实际引用以脚本校验为准，不假定全覆盖）。学习形态为**自由探索 + 轻量练习**（不计时、不套用 TrainingShell），**记录进度但所有阶段始终可自由进入、不锁关卡**。

### 已确认的产品决策（来自需求澄清）
- 音频源：**全部用 hugolpz/audio-cmn**（音节 + 汉字词都用真人录音，不用 TTS）
- 学习形态：**自由探索 + 轻量练习**（答对即过、无计时、无休息提醒）
- 汉字联系深度：**认读练习**（听音选字 / 看拼音选字，不涉及书写笔顺）
- 进度管理：**记录进度、显示进度，但不强制解锁**
- 仓库与合规：仓库为 **public**，音频**随仓库一并提交**，**保留 CC-by-sa 署名**（LICENSE/NOTICE + 应用内署名）
- 字母读音缺口：唯一无独立音节录音的韵母 `ong`（及基础课程不单列的 `iong`）采用**代表音节 + 高亮韵母**处理，**不外部补充**
- 学习顺序：**"认字母"阶段把字母按统编版学习顺序线性排列**（单韵母→声母分组→复韵母/鼻韵母，整体认读音节随相应字母穿插），**不分课时**，从前往后逐个点读

---

## 音频源关键事实（hugolpz/audio-cmn）

- 仓库：`https://github.com/hugolpz/audio-cmn`，授权 **CC-by-sa**
- 音节：`64k/syllabs/cmn-{拼音}{声调}.mp3`，**声调仅 1–4 声**；**无孤立轻声(5)音节**（实测 `cmn-de5.mp3`、`cmn-ma5.mp3` 均 404；audio-cmn 曾删除 `*5` 副本）。轻声只能借**词音频** `cmn-{汉字}.mp3`（如 妈妈 mā ma）在语境中体现，不播孤立轻声音节
  - **ü 在文件名中写作 v**：`nü3` → `cmn-nv3.mp3`，`lüe` → `cmn-lve4.mp3`（已实测存在）
  - 少数语气/特殊音节带前缀下划线（如 `cmn-_m1.mp3`、`cmn-_hng2.mp3`），普通教学用不到
- 汉字 / 词：`64k/hsk/cmn-{汉字}.mp3`，文件名即汉字本身（如 `cmn-妈妈.mp3`），需 URL 编码取用
- 无清单文件，需我们自建数据集；推荐使用 64k 档（音节、词通用最优）

### 教学法约束（重要）
hugolpz 只有**音节级**录音，没有孤立的声母 / 韵母发音。因此"认字母"阶段：
- **声母**用"呼读音"映射到已有音节播放：b→bo、p→po、m→mo、f→fo、d→de、t→te、n→ne、l→le、g→ge、k→ke、h→he、j→ji、q→qi、x→xi、zh→zhi、ch→chi、sh→shi、r→ri、z→zi、c→ci、s→si、y→yi、w→wu
- **韵母**优先用能独立成音节者（a/o/e/i→yi/u→wu/ü→yu、ai/ei/ao/ou、an/en/ang/eng/er…）；以零声母形式存在者用其对应音节（ui→wei、iu→you、ie→ye、üe→yue、in→yin、un→wen、ün→yun、ing→ying）
- 该映射在数据层（`pinyin-data.ts`）一次性人工标定：**声母带 `audioSyllable`（呼读音音节），韵母带 `audioRepresentative`（代表音）**
- **唯一真空：`ong`（及 `iong`）无独立音节录音**——用代表音节播放并高亮韵母部分（`ong`→`cmn-hong1.mp3`、`iong`→`cmn-xiong1.mp3`），数据层用 `audioRepresentative` + `highlightFinal` 字段标记，不做外部补充
  - ⚠️ 语义边界：代表音节是**"例音节"而非"韵母本音"**（含声母、受协同发音影响）。UI 文案需说明"这是带 ong 的字音"；**练习判题不得要求孩子从该音频识别孤立韵母**。此约束同样适用于所有用呼读音/零声母音节代表的声母韵母

#### 覆盖情况（已实测验证）
hugolpz 约 1707 个音节，近乎完整音节表。实测确认：`cmn-bo1.mp3`（声母呼读音）✅、`cmn-nv3.mp3`（ü→v）✅、`cmn-lve4.mp3`（lüe→lve）✅、`cmn-ong1.mp3` ❌（404，印证 ong 缺口）、`cmn-de5.mp3`/`cmn-ma5.mp3` ❌（404，印证无轻声音节）。结论：声母 / 单韵母 / 整体认读音节 / **四声(1–4)** 全覆盖；复韵母、鼻韵母除 `ong`/`iong` 外均可由独立或零声母音节覆盖；**轻声无孤立音节，仅词音频中呈现**。

> ⚠️ **音频存在性必须可验证**：HSK 词表并非完整覆盖（audio-cmn README 明示有 missing 列表），加之 ü→v、特殊 `_hm/_hng/_m`、汉字 URL 编码等坑，所有 `audioSyllable`（声母）/`audioRepresentative`（韵母）/`audioKey`（拼读音节）及例字/词引用都必须经脚本校验存在（见《音频获取与合规》），否则录入错误要到运行时 404 才暴露。

---

## 字母学习顺序（统编版）

"认字母"阶段把声母 / 韵母 / 整体认读音节按统编版**学习顺序线性排列**，**不分课时**，孩子从前往后逐个点读。完整顺序如下（`|` 仅为自然语音分组，便于阅读，非课时）：

```
单韵母：  a o e ｜ i u ü
声母：    y w ｜ b p m f ｜ d t n l ｜ g k h ｜ j q x ｜ z c s ｜ zh ch sh r
复韵母：  ai ei ui ｜ ao ou iu ｜ ie üe er
鼻韵母：  an en in un ün ｜ ang eng ing ong
整体认读：随相应字母穿插出现 —— yi wu yu（随 i u ü）、zi ci si（随 z c s）、
         zhi chi shi ri（随 zh ch sh r）、ye yue（随 ie üe）、
         yin yun yuan（随 an en in un ün）、ying（随 ang eng ing ong）
```

> 采用**统编版（=部编版）**学习顺序。**已确认江苏现行小学语文为统编版**（苏教版语文已停用；2024 秋起一年级启用 2022 课标修订新版）。该顺序由 `pinyin-data.ts` 的有序数组驱动，若需微调只改这份数据。
> 四声（含标调规则）在开头的单韵母 a o e / i u ü 上演示，不单设类别。

---

## 架构设计

复用项目既有模式：`pages/` 放整页、`components/<module>/` 放模块组件、`hooks/` 放逻辑、`lib/` 放纯数据与工具、`types/` 放类型；导航用 `useNavigate` + HashRouter；共享组件 `BackButton`/`MascotBubble`/`StarReward`/`MuteToggle`/`PageContainer` 直接复用；暗黑模式用语义令牌。

> **音频职责分离**：现有 `useSound` 只合成 click/correct/wrong 等**提示音**，**不**负责拼音真人录音；拼音 mp3 由新 `usePinyinAudio` 独立播放。两者**都须读取 `settings.sound`/复用 `MuteToggle` 的静音语义**——静音时提示音和拼音录音都不出声。

### 路由（新增，挂在 `src/App.tsx`）
```
/pinyin                     PinyinHomePage      三阶段入口（认字母/拼读/汉字联系）+ 进度总览
/pinyin/letters             PinyinLettersPage   按学习顺序排列的字母序列 + 点读/跟读（含四声演示）
/pinyin/blend               PinyinBlendPage     拼读：选声母+韵母+声调→拼出音节→听整体读音 + 轻练习
/pinyin/characters          PinyinCharactersPage 汉字认读练习（听音选字 / 看拼音选字）
```

### 新增文件
| 文件 | 职责 | 复用/参考 |
|---|---|---|
| `src/types/pinyin.ts` | 类型：`Initial`（含 `audioSyllable` + `canBlend`：y/w 标 `false` 不参与拼读）/`Final`（含 `displayFinal`/`canonicalFinal`/`audioRepresentative` 三态）/`Tone`/`Syllable`/`ExampleWord`/`PracticeItem`/`PinyinProgress` | 参考 `types/multiplication.ts` 的分级数据建模 |
| `src/lib/pinyin-data.ts` | **静态课程表**：字母按学习顺序的有序数组（每项带 `order` 序号 + `category` 类别标签：声母/单韵母/复韵母/鼻韵母/整体认读，无课时分层）；声母（23，含 `audioSyllable`）、韵母（单/复/鼻，含 `audioRepresentative`/`highlightFinal`）、声调（**1–4**）、整体认读音节、每音节 1–2 个例字/词。**纯数据，与查询/出题函数分层** | 参考 `lib/multiplication.ts`（硬编码数据） |
| `src/lib/pinyin-syllables.ts` | **本课程目标音节表（拼读唯一数据源）**：课程范围内全部合法"声母+韵母"组合及正写形式（含拼读所需介音韵母，人工白名单）；`isValidBlend(initial, final)` / `toSyllable(initial, final, tone)→{display,audioKey,base,tone}` 校验与正写函数，单独可单测 | 新增 |
| `src/lib/pinyin-practice.ts` | 查询与随机出题函数（`generatePinyin*Item`），与静态数据解耦 | 参考 `lib/multiplication.ts` 的 `generate*PracticeItem` |
| `src/lib/pinyin-audio.ts` | 把 `audioKey`（已 ü→v 归一）/ 汉字 拼成本地音频路径，处理下划线特殊音节、汉字 URL 编码（ü→v 归一已在 `toSyllable`/数据层完成，此处不二次转换） | 新增；路径指向 `public/audio/cmn/...` |
| `src/hooks/usePinyinAudio.ts` | 播放静态 mp3，含小缓存 + 预加载，跟读/连读队列；**用 `fetch()` 取完整 blob → `URL.createObjectURL` → `new Audio(blobUrl)` 播放**（彻底避开 Range/206，离线可靠）；**缓存淘汰/unmount 时 `URL.revokeObjectURL` 释放**防内存积累；**读取 `settings.sound`，静音时不出声**；加载失败（404）兜底（不崩、可提示） | 简化自 `hooks/useMultiplicationPlayback.ts`（去 TTS 合成，复用其 object URL 清理模式） |
| `src/hooks/usePinyinPractice.ts` | 轻量练习状态机：出题、判对错、答对即过、错 1 次提示/错 2 次给答案 | 参考 `hooks/useMultiplicationPractice.ts` 的错误计数与自动推进逻辑 |
| `src/hooks/usePinyinProgress.ts` | 读写学习进度 | 用 localStorage，见下 |
| `src/pages/PinyinHomePage.tsx` | 阶段选择 + 进度展示 | 参考 `MultiplicationPracticeSelectPage.tsx` |
| `src/pages/PinyinLettersPage.tsx` | **按学习顺序排列的字母序列**，逐个点读；类别标签仅用于分色/分段展示；含四声演示 | 参考 `MultiplicationTablePage.tsx`（点选+朗读+进度） |
| `src/pages/PinyinBlendPage.tsx` | 拼读交互 | 新增 |
| `src/pages/PinyinCharactersPage.tsx` | 汉字认读练习 | 参考 `MultiplicationPracticePage.tsx`（去掉 TrainingShell 外壳） |
| `src/components/pinyin/LetterCard.tsx` | 声母/韵母卡片（点击发音、显示掌握标记） | 复用 `StarReward`/`MascotBubble` |
| `src/components/pinyin/ToneDemo.tsx` | 四声演示（同一韵母 4 声对比播放），在开头单韵母处呈现 | — |
| `src/components/pinyin/BlendBuilder.tsx` | 声母+韵母+声调拼合控件 | — |
| `src/components/pinyin/OptionGrid.tsx` | 认读练习选项网格（听音选字等） | — |
| `scripts/fetch-pinyin-audio.mjs` | 汇总 `pinyin-data.ts`（声母 `audioSyllable`/韵母 `audioRepresentative`/例字词）**+ `pinyin-syllables.ts`（拼读音节 `audioKey`）+ 例字白名单** 计算所需文件，从 raw.githubusercontent 下载到 `public/audio/cmn/`，并写入 LICENSE/NOTICE | 新增构建脚本 |

### 修改文件
| 文件 | 改动 |
|---|---|
| `src/App.tsx` | 注册 4 条 `/pinyin*` 路由 |
| `src/pages/HomePage.tsx` | 新增"拼音岛"模块卡片（第 5 个入口） |
| `src/lib/storage.ts` | 新增进度键 `math-island:pinyin-progress` 及 load/save 帮助函数，**并把该键加入 `KEYS` 常量**——现有 `clearAllData()` 只遍历 `KEYS`，不加则设置面板"清空本地数据"会残留拼音进度 |
| `src/index.css` | 新增 `--color-pinyin` / `--color-pinyin-light` 语义令牌（有对应工具类，正常 `@theme` 即可），并在 `.dark` 块加降饱和深色覆盖。**若用到渐变/阴影/专用 surface 等"仅在任意值 `var()` 中引用"的令牌，须放 `@theme static` 或普通 `:root` 防 tree-shake**（参考现有乘法模块 `src/index.css:40-69` 做法），并在 `.dark` 同名覆盖 |
| `vite.config.ts` | Workbox：现有 `globPatterns` 为 `{js,css,html,svg,png,json}`，**本就不含 mp3、无需 globIgnores**。只需在现有 `runtimeCaching` 数组追加一条 `/audio/cmn/` 规则：`CacheFirst`、独立 `cacheName`、`urlPattern` 限**同源音频路径**、`expiration`（`maxEntries`/`maxAgeSeconds`）、`cacheableResponse: { statuses: [200] }`（**不缓存 404**）。⚠️ **MP3 经 `HTMLAudioElement` 播放可能发 Range 请求返回 `206`**，206 不会被缓存→"首播后离线"落空；解法：**播放前先 `fetch()` 预取完整 200 写入缓存**（见 `usePinyinAudio`），或加 Workbox `RangeRequestsPlugin` 并确保缓存内有完整 200。注意 HashRouter 下音频用以 app base 为准的绝对路径 |

---

## 关键设计点

### 进度数据（localStorage，不锁关卡）
小体量（数百个 id），用 localStorage 即可，沿用 `storage.ts` 的 `{...DEFAULT, ...parsed}` 合并兼容模式，避免 IndexedDB 版本迁移。**用 `Record<id, …>` 而非数组**，天然去重、避免反复点击重复计数：
```ts
interface PinyinProgress {
  version: number                      // 结构版本，便于后续迁移
  learned: Record<string, number>      // id（声母/韵母/音节）→ 首次学过时间戳，去重
  characterCorrect: Record<string, number> // 认读练习每字答对次数
}
```
- **id 稳定**：用拼音本身（如 `sheng-b`、`yun-ang`、`ma1`）做 id，不依赖 `order` 序号，调整学习顺序不影响已存进度。
- **读取时按当前数据集过滤废弃 id**（课程调整后老 id 不再计入展示），`version` 不符时做迁移或重置。
- 各阶段页面展示进度（进度条 / 小星星），但入口始终可点。

### 三个阶段的交互
- **认字母**：按学习顺序排成**一条字母序列**（按类别分色/分段，但不分课时），点字母卡 → 播 `audioSyllable` 录音 → 标记"学过"。开头单韵母处用 `ToneDemo` 演示四声；整体认读音节穿插在序列对应位置。可从任意位置点读。
- **拼读**：`BlendBuilder` 选一个声母 + 一个韵母 + 一个声调 → **经 `isValidBlend` 校验**（见下《拼读合法性》）→ 合法则用 `toSyllable` 生成**正写音节**并播放真人录音；不合法则给柔性提示且不出音。轻练习：给目标音节让孩子拼对。
- **汉字联系**：`usePinyinPractice` 出题。两种题型随机：①**听音选字**（播放**目标字的单字音** `cmn-{字}.mp3`，4 个汉字选项中选对应字）②**看拼音选字**（给单字拼音选字）。题目播放**与考查目标一致的音频**（考单字就播单字音、不混词音）；选项与正确答案需**规避同音字/形近字干扰失控**。**例字一律人工白名单**（确保 `cmn-{字}.mp3` 存在、避开多音字/儿化/词内变调），**不从 HSK 文件名自动抽题**。答对 `StarReward` + 自动下一题；错 1 次提示、错 2 次给答案。

### 拼读合法性（关键，防止笛卡尔积拼接）

**范围 = 本课程目标音节表**（课程声母 × 所需韵母中**实际合法**的音节，含拼读所需介音韵母 `ia/iao/ian/iang/ua/uai/uan/uang/uo/üan` 等；人工白名单 + 脚本校验，**不承诺普通话全量**）。**不是任意"声母+韵母"都合法**，`BlendBuilder` 以 `pinyin-syllables.ts` 的目标音节表为**唯一数据源**，且处理正写规则：

- **声母选项 = 21 个真辅音**：`b p m f d t n l g k h j q x zh ch sh r z c s`。**`y/w` 不作拼读声母**——它们是零声母拼写约定，`yi/wu/yu/ya/ye/wa/wo…` 作为整体认读/零声母音节在"认字母"展示，不进 BlendBuilder 拼合（类型上 `y/w` 标 `canBlend:false`，BlendBuilder 只取 `canBlend` 声母，防止 `Initial` 类型被复用错）。
- **韵母 display / canonical / audio 三态分离**（解决 `ui`↔`uei` 不一致）：每个韵母带 `displayFinal`（孩子看到，如 `ui`）、`canonicalFinal`（拼读内部，如 `uei`）、`audioRepresentative`（代表音，如 `wei1`）。
- **不合法组合**直接禁用/提示，例：`b+e`、`f+i`、`g+ü`、`p+ong`、`d+ia` 不存在。
- **ü 的正写**：`j/q/x + ü` 写作 `ju/qu/xu`（去两点）；`n/l + ü` 保留 `nü/lü`。
- **介韵缩写**：有声母时 canonical `iou/uei/uen` 正写为 `iu/ui/un`（如 `n+iou`→`niu`、`g+uei`→`gui`、`d+uen`→`dun`）。
- **特殊 i**：`zhi/chi/shi/ri/zi/ci/si` 的 `i` 是空韵，与普通 `i`（如 `ni`）不同，属整体认读，不参与自由拼读。

`toSyllable(initial, final, tone)` 返回**结构化结果** `{ display: 'mā', audioKey: 'ma1', base: 'ma', tone: 1 }`（覆盖 `nü/lü`、`lüe/lve`、`jue/xue` 等边界）。**`audioKey` 即音频文件 stem、已完成 ü→v 归一**（如 `ma1`/`nv3`/`lve4`/`jue2`）；`pinyin-audio.ts` 直接据此拼路径，**不再二次转换**。该表可独立单测，避免运行时 404 或错配。

### 音频获取与合规（CC-by-sa）
- 仓库为 public，**音频随仓库一并 commit**（再分发场景），故必须履行 CC-by-sa 署名义务。
- `scripts/fetch-pinyin-audio.mjs` 读取课程数据 → 汇总所需音节 + 汉字词文件 → 从 `64k/syllabs/` 与 `64k/hsk/` 下载到 `public/audio/cmn/`（脚本仅用于初次/补充拉取）。**只下载课程实际用到的子集**（声母呼读音 + 韵母代表音 + 整体认读 + 拼读练习涉及音节 + 例字/词，约数百个文件），控制仓库体积。
- **脚本须做存在性校验**：先按数据生成"所需文件清单" → 对每个 URL 做 HEAD/下载校验 → 输出**缺失报告**（含 ü→v、特殊 `_` 前缀、HSK 词缺失等情况），可在 CI 中运行；有缺失则失败，倒逼修数据或替换例字，杜绝运行时 404。
- 在 `public/audio/cmn/` 写入 `LICENSE-CC-BY-SA.txt` 与署名 `NOTICE`（发音人 Chen Wang、Yue Tan；项目方 Hugo Lopez、Nicolas Vion；仓库链接；许可证名称与版本）；在设置面板/关于处增加一行音频版权署名 + 许可证链接。
  - **合规定性（非确定法律结论，建议正式发布前法律复核）**：本方案**原样再分发**音频，通常按"集合/聚合"处理，**源码无需改用 CC-BY-SA**；但分享时必须保留署名、版权/许可证链接、以及"是否修改"的声明。ShareAlike 仅在分享**改编材料**（剪辑/降噪/混音/合成到视频时间轴等）时才额外要求以兼容许可发布——本方案不做此类加工。
- 音频走 Workbox 运行时缓存（CacheFirst），不进 PWA 预缓存清单（避免安装包膨胀）。

### 暗黑模式
所有新页面用语义令牌（`bg-bg`/`bg-surface`/`text-text`/`border-border` 等），新增模块色 `--color-pinyin`，遵循 `docs/plans/2026-06-08-dark-mode-design.md` 既定规范；不写死 `bg-white`/`gray-*`。**渐变/阴影/专用 surface 令牌走 `@theme static` 或 `:root`+`.dark`，避免被 Tailwind v4 tree-shake 掉**（项目乘法模块已有此先例）。

---

## 分步实施计划

1. **数据与音频地基**：写 `types/pinyin.ts` + `lib/pinyin-data.ts`（课程表，含 `audioSyllable`/`audioRepresentative`/`highlightFinal`、例字/词）+ `lib/pinyin-syllables.ts`（**合法音节表 + `isValidBlend`/`toSyllable`，附单测**）→ 写 `scripts/fetch-pinyin-audio.mjs`（汇总三处引用 **生成清单→存在性校验→缺失报告→下载**）并执行 → 确认 `public/audio/cmn/` 子集齐全、无缺失。
2. **音频与播放**：`lib/pinyin-audio.ts`（用**已归一的 `audioKey`** 拼路径，只处理下划线特殊音节 / 汉字 URL 编码，**不二次转换 ü→v**）+ `hooks/usePinyinAudio.ts`（blob 播放 + `revokeObjectURL` 清理、读 `settings.sound`、404 兜底）。
3. **入口与路由**：`App.tsx` 加路由、`HomePage.tsx` 加卡片、`index.css` 加 `--color-pinyin`、`PinyinHomePage.tsx`。
4. **认字母阶段**：`PinyinLettersPage.tsx`（按学习顺序的字母序列）+ `LetterCard`/`ToneDemo`。
5. **拼读阶段**：`PinyinBlendPage.tsx` + `BlendBuilder`，接 `isValidBlend`/`toSyllable` 校验与正写。
6. **汉字认读阶段**：`PinyinCharactersPage.tsx` + `usePinyinPractice` + `OptionGrid` + `lib/pinyin-practice.ts` 出题函数。
7. **进度持久化**：`storage.ts` 帮助函数（键纳入 `KEYS`）+ `usePinyinProgress.ts`（`Record` 去重、`version` 迁移），各页接入。
8. **PWA 与合规**：`vite.config.ts` 追加 `/audio/cmn/` runtimeCaching（不缓存 404）+ LICENSE/NOTICE/应用内署名；缺失报告脚本纳入 CI。

---

## 验证方式（端到端）

1. `npm run dev`，导航到首页 → 出现"拼音岛"卡片 → 进入 `/pinyin`。
2. **认字母**：确认字母按学习顺序（a o e → … → ang eng ing ong）线性展示、无课时分层；点 a 听四声、点 b 听呼读音 bo，"学过"标记出现。
3. **拼读**：选 m + a + 一声 → 拼出 "mā" 并播放 `cmn-ma1.mp3`；选 j + ü → **正写 "ju"**；选 g + ui（孩子看到 display=ui）→ 内部 canonical=uei → **正写 "gui"**；选 b + e（非法）→ **禁用/柔性提示且不出音**。
4. **汉字联系**：听音选字播放的是**目标单字音**（非词音）；答对 → 星星 + 自动下一题；故意答错 → 错 1 次提示、错 2 次给答案；检查选项无失控的同音/形近干扰。
5. **进度**：反复点同一字母**不重复计数**；刷新后进度仍在；在设置面板"**清空本地数据**"后，拼音进度被一并清除（验证已纳入 `KEYS`）。
6. **音频边界**：确认无任何对孤立轻声音节的请求（轻声只在词音频出现）；ong/iong 文案标为"例音节"，判题不考孤立韵母识别。
7. **暗黑模式**：设置切到深色，逐页检查无白底刺眼、对比度正常；若用了渐变/阴影令牌，确认深色下正确生效（未被 tree-shake）。
8. **离线**：首次加载并播放若干音频后断网刷新，确认页面与已缓存音频可用；确认 404 音频未被缓存（`npm run build && npm run preview` 下验证 PWA）。
9. **音频清单校验**：`node scripts/fetch-pinyin-audio.mjs --check`（或等价）输出**零缺失**。
10. `npm run lint` 通过；`npx tsc --noEmit` 类型检查通过；`pinyin-syllables` 单测通过。
