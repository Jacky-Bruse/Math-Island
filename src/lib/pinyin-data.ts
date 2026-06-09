// 拼音课程静态数据（纯数据，查询/出题在 pinyin-practice.ts，拼读合法性在 pinyin-syllables.ts）
// 顺序依统编版一年级上册：单韵母 → 声母分组 → 复韵母/鼻韵母，整体认读音节穿插。
// 设计见 docs/plans/2026-06-09-pinyin-learning-design.md

import type { Initial, Final, WholeSyllable, LetterEntry, ExampleWord } from '../types/pinyin'

// ── 声母（23）。audioSyllable 为呼读音音频 stem；y/w 不参与拼读 ──
export const INITIALS: Initial[] = [
  { id: 'b', letter: 'b', audioSyllable: 'bo1', canBlend: true },
  { id: 'p', letter: 'p', audioSyllable: 'po1', canBlend: true },
  { id: 'm', letter: 'm', audioSyllable: 'mo1', canBlend: true },
  { id: 'f', letter: 'f', audioSyllable: 'fo1', canBlend: true },
  { id: 'd', letter: 'd', audioSyllable: 'de1', canBlend: true },
  { id: 't', letter: 't', audioSyllable: 'te1', canBlend: true },
  { id: 'n', letter: 'n', audioSyllable: 'ne1', canBlend: true },
  { id: 'l', letter: 'l', audioSyllable: 'le1', canBlend: true },
  { id: 'g', letter: 'g', audioSyllable: 'ge1', canBlend: true },
  { id: 'k', letter: 'k', audioSyllable: 'ke1', canBlend: true },
  { id: 'h', letter: 'h', audioSyllable: 'he1', canBlend: true },
  { id: 'j', letter: 'j', audioSyllable: 'ji1', canBlend: true },
  { id: 'q', letter: 'q', audioSyllable: 'qi1', canBlend: true },
  { id: 'x', letter: 'x', audioSyllable: 'xi1', canBlend: true },
  { id: 'zh', letter: 'zh', audioSyllable: 'zhi1', canBlend: true },
  { id: 'ch', letter: 'ch', audioSyllable: 'chi1', canBlend: true },
  { id: 'sh', letter: 'sh', audioSyllable: 'shi1', canBlend: true },
  { id: 'r', letter: 'r', audioSyllable: 'ri1', canBlend: true },
  { id: 'z', letter: 'z', audioSyllable: 'zi1', canBlend: true },
  { id: 'c', letter: 'c', audioSyllable: 'ci1', canBlend: true },
  { id: 's', letter: 's', audioSyllable: 'si1', canBlend: true },
  { id: 'y', letter: 'y', audioSyllable: 'yi1', canBlend: false },
  { id: 'w', letter: 'w', audioSyllable: 'wu1', canBlend: false },
]

// ── 韵母（24）。display/canonical/audio 三态分离 ──
export const FINALS: Final[] = [
  // 单韵母
  { id: 'a', displayFinal: 'a', canonicalFinal: 'a', audioRepresentative: 'a1', category: 'single-final' },
  { id: 'o', displayFinal: 'o', canonicalFinal: 'o', audioRepresentative: 'o1', category: 'single-final' },
  { id: 'e', displayFinal: 'e', canonicalFinal: 'e', audioRepresentative: 'e1', category: 'single-final' },
  { id: 'i', displayFinal: 'i', canonicalFinal: 'i', audioRepresentative: 'yi1', category: 'single-final' },
  { id: 'u', displayFinal: 'u', canonicalFinal: 'u', audioRepresentative: 'wu1', category: 'single-final' },
  { id: 'v', displayFinal: 'ü', canonicalFinal: 'ü', audioRepresentative: 'yu1', category: 'single-final' },
  // 复韵母
  { id: 'ai', displayFinal: 'ai', canonicalFinal: 'ai', audioRepresentative: 'ai1', category: 'compound-final' },
  { id: 'ei', displayFinal: 'ei', canonicalFinal: 'ei', audioRepresentative: 'ei1', category: 'compound-final' },
  { id: 'uei', displayFinal: 'ui', canonicalFinal: 'uei', audioRepresentative: 'wei1', category: 'compound-final' },
  { id: 'ao', displayFinal: 'ao', canonicalFinal: 'ao', audioRepresentative: 'ao1', category: 'compound-final' },
  { id: 'ou', displayFinal: 'ou', canonicalFinal: 'ou', audioRepresentative: 'ou1', category: 'compound-final' },
  { id: 'iou', displayFinal: 'iu', canonicalFinal: 'iou', audioRepresentative: 'you1', category: 'compound-final' },
  { id: 'ie', displayFinal: 'ie', canonicalFinal: 'ie', audioRepresentative: 'ye1', category: 'compound-final' },
  { id: 'ue', displayFinal: 'üe', canonicalFinal: 'üe', audioRepresentative: 'yue1', category: 'compound-final' },
  { id: 'er', displayFinal: 'er', canonicalFinal: 'er', audioRepresentative: 'er2', category: 'compound-final' },
  // 鼻韵母
  { id: 'an', displayFinal: 'an', canonicalFinal: 'an', audioRepresentative: 'an1', category: 'nasal-final' },
  { id: 'en', displayFinal: 'en', canonicalFinal: 'en', audioRepresentative: 'en1', category: 'nasal-final' },
  { id: 'in', displayFinal: 'in', canonicalFinal: 'in', audioRepresentative: 'yin1', category: 'nasal-final' },
  { id: 'uen', displayFinal: 'un', canonicalFinal: 'uen', audioRepresentative: 'wen1', category: 'nasal-final' },
  { id: 'vn', displayFinal: 'ün', canonicalFinal: 'ün', audioRepresentative: 'yun1', category: 'nasal-final' },
  { id: 'ang', displayFinal: 'ang', canonicalFinal: 'ang', audioRepresentative: 'ang1', category: 'nasal-final' },
  { id: 'eng', displayFinal: 'eng', canonicalFinal: 'eng', audioRepresentative: 'eng1', category: 'nasal-final' },
  { id: 'ing', displayFinal: 'ing', canonicalFinal: 'ing', audioRepresentative: 'ying1', category: 'nasal-final' },
  // ong 无独立音节录音：用代表音节 hong 播放并高亮 ong
  { id: 'ong', displayFinal: 'ong', canonicalFinal: 'ong', audioRepresentative: 'hong1', highlightFinal: 'ong', category: 'nasal-final' },
]

// ── 整体认读音节（16） ──
export const WHOLE_SYLLABLES: WholeSyllable[] = [
  { id: 'zhi', syllable: 'zhi', audioKey: 'zhi1' },
  { id: 'chi', syllable: 'chi', audioKey: 'chi1' },
  { id: 'shi', syllable: 'shi', audioKey: 'shi1' },
  { id: 'ri', syllable: 'ri', audioKey: 'ri4' },
  { id: 'zi', syllable: 'zi', audioKey: 'zi1' },
  { id: 'ci', syllable: 'ci', audioKey: 'ci2' },
  { id: 'si', syllable: 'si', audioKey: 'si1' },
  { id: 'yi', syllable: 'yi', audioKey: 'yi1' },
  { id: 'wu', syllable: 'wu', audioKey: 'wu1' },
  { id: 'yu', syllable: 'yu', audioKey: 'yu2' },
  { id: 'ye', syllable: 'ye', audioKey: 'ye4' },
  { id: 'yue', syllable: 'yue', audioKey: 'yue4' },
  { id: 'yuan', syllable: 'yuan', audioKey: 'yuan2' },
  { id: 'yin', syllable: 'yin', audioKey: 'yin1' },
  { id: 'yun', syllable: 'yun', audioKey: 'yun2' },
  { id: 'ying', syllable: 'ying', audioKey: 'ying1' },
]

const initialById = new Map(INITIALS.map(i => [i.id, i]))
const finalById = new Map(FINALS.map(f => [f.id, f]))
const wholeById = new Map(WHOLE_SYLLABLES.map(w => [w.id, w]))

// ── 学习线性顺序（统编版；whole 穿插）。以 id 引用，构造 LetterEntry[] ──
type OrderRef =
  | { kind: 'initial'; id: string }
  | { kind: 'final'; id: string }
  | { kind: 'whole'; id: string }

const ORDER: OrderRef[] = [
  // 单韵母 a o e
  { kind: 'final', id: 'a' }, { kind: 'final', id: 'o' }, { kind: 'final', id: 'e' },
  // 单韵母 i u ü + 声母 y w + 整体认读 yi wu yu
  { kind: 'final', id: 'i' }, { kind: 'final', id: 'u' }, { kind: 'final', id: 'v' },
  { kind: 'initial', id: 'y' }, { kind: 'initial', id: 'w' },
  { kind: 'whole', id: 'yi' }, { kind: 'whole', id: 'wu' }, { kind: 'whole', id: 'yu' },
  // 声母 b p m f / d t n l / g k h / j q x
  { kind: 'initial', id: 'b' }, { kind: 'initial', id: 'p' }, { kind: 'initial', id: 'm' }, { kind: 'initial', id: 'f' },
  { kind: 'initial', id: 'd' }, { kind: 'initial', id: 't' }, { kind: 'initial', id: 'n' }, { kind: 'initial', id: 'l' },
  { kind: 'initial', id: 'g' }, { kind: 'initial', id: 'k' }, { kind: 'initial', id: 'h' },
  { kind: 'initial', id: 'j' }, { kind: 'initial', id: 'q' }, { kind: 'initial', id: 'x' },
  // 声母 z c s + 整体认读 zi ci si
  { kind: 'initial', id: 'z' }, { kind: 'initial', id: 'c' }, { kind: 'initial', id: 's' },
  { kind: 'whole', id: 'zi' }, { kind: 'whole', id: 'ci' }, { kind: 'whole', id: 'si' },
  // 声母 zh ch sh r + 整体认读 zhi chi shi ri
  { kind: 'initial', id: 'zh' }, { kind: 'initial', id: 'ch' }, { kind: 'initial', id: 'sh' }, { kind: 'initial', id: 'r' },
  { kind: 'whole', id: 'zhi' }, { kind: 'whole', id: 'chi' }, { kind: 'whole', id: 'shi' }, { kind: 'whole', id: 'ri' },
  // 复韵母 ai ei ui / ao ou iu / ie üe er + 整体认读 ye yue
  { kind: 'final', id: 'ai' }, { kind: 'final', id: 'ei' }, { kind: 'final', id: 'uei' },
  { kind: 'final', id: 'ao' }, { kind: 'final', id: 'ou' }, { kind: 'final', id: 'iou' },
  { kind: 'final', id: 'ie' }, { kind: 'final', id: 'ue' }, { kind: 'final', id: 'er' },
  { kind: 'whole', id: 'ye' }, { kind: 'whole', id: 'yue' },
  // 鼻韵母 an en in un ün + 整体认读 yin yun yuan
  { kind: 'final', id: 'an' }, { kind: 'final', id: 'en' }, { kind: 'final', id: 'in' },
  { kind: 'final', id: 'uen' }, { kind: 'final', id: 'vn' },
  { kind: 'whole', id: 'yin' }, { kind: 'whole', id: 'yun' }, { kind: 'whole', id: 'yuan' },
  // 鼻韵母 ang eng ing ong + 整体认读 ying
  { kind: 'final', id: 'ang' }, { kind: 'final', id: 'eng' }, { kind: 'final', id: 'ing' }, { kind: 'final', id: 'ong' },
  { kind: 'whole', id: 'ying' },
]

export const LETTER_SEQUENCE: LetterEntry[] = ORDER.map((ref): LetterEntry => {
  if (ref.kind === 'initial') {
    const data = initialById.get(ref.id)
    if (!data) throw new Error(`未知声母 id: ${ref.id}`)
    return { kind: 'initial', data }
  }
  if (ref.kind === 'final') {
    const data = finalById.get(ref.id)
    if (!data) throw new Error(`未知韵母 id: ${ref.id}`)
    return { kind: 'final', data }
  }
  const data = wholeById.get(ref.id)
  if (!data) throw new Error(`未知整体认读 id: ${ref.id}`)
  return { kind: 'whole', data }
})

// 每个 LetterEntry 的稳定进度 id（不依赖顺序）
export function letterEntryId(entry: LetterEntry): string {
  return `${entry.kind}:${entry.data.id}`
}

// BlendBuilder 可选声母（canBlend）/ 可选韵母（排除 er，er 不与声母相拼）
export const BLEND_INITIALS: Initial[] = INITIALS.filter(i => i.canBlend)
export const BLEND_FINALS: Final[] = FINALS.filter(f => f.id !== 'er')

// ── 例字白名单（“汉字联系”阶段；均为单字、避开多音字，音频取 cmn-{hanzi}.mp3）──
// 注：每个汉字的 cmn-{hanzi}.mp3 存在性由 fetch-pinyin-audio 脚本校验。
export const EXAMPLE_WORDS: ExampleWord[] = [
  { hanzi: '八', pinyin: 'bā' },
  { hanzi: '马', pinyin: 'mǎ' },
  { hanzi: '大', pinyin: 'dà' },
  { hanzi: '土', pinyin: 'tǔ' },
  { hanzi: '路', pinyin: 'lù' },
  { hanzi: '高', pinyin: 'gāo' },
  { hanzi: '口', pinyin: 'kǒu' },
  { hanzi: '河', pinyin: 'hé' },
  { hanzi: '七', pinyin: 'qī' },
  { hanzi: '西', pinyin: 'xī' },
  { hanzi: '日', pinyin: 'rì' },
  { hanzi: '字', pinyin: 'zì' },
  { hanzi: '四', pinyin: 'sì' },
  { hanzi: '云', pinyin: 'yún' },
  { hanzi: '鱼', pinyin: 'yú' },
  { hanzi: '月', pinyin: 'yuè' },
  { hanzi: '雨', pinyin: 'yǔ' },
  { hanzi: '一', pinyin: 'yī' },
  { hanzi: '五', pinyin: 'wǔ' },
  { hanzi: '三', pinyin: 'sān' },
  { hanzi: '九', pinyin: 'jiǔ' },
  { hanzi: '水', pinyin: 'shuǐ' },
  { hanzi: '火', pinyin: 'huǒ' },
  { hanzi: '草', pinyin: 'cǎo' },
  { hanzi: '花', pinyin: 'huā' },
  { hanzi: '你', pinyin: 'nǐ' },
  { hanzi: '好', pinyin: 'hǎo' },
  { hanzi: '小', pinyin: 'xiǎo' },
]

export function getInitialById(id: string): Initial | undefined {
  return initialById.get(id)
}
export function getFinalById(id: string): Final | undefined {
  return finalById.get(id)
}
