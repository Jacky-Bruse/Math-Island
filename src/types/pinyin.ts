// 拼音学习模块（拼音岛）类型定义

export type Tone = 1 | 2 | 3 | 4

// 韵母类别：6 个单韵母 / 8 个复韵母 / er / 5 个前鼻韵母 / 4 个后鼻韵母
export type FinalCategory =
  | 'single-final'
  | 'compound-final'
  | 'special-final'
  | 'front-nasal-final'
  | 'back-nasal-final'

// 认读类别：声母 / 各类韵母 / 整体认读音节
export type LetterCategory =
  | 'initial'
  | FinalCategory
  | 'whole-syllable'

// 声母
export interface Initial {
  id: string // 形如 'b'、'zh'
  letter: string // 显示字形，同 id
  // 呼读音音频文件 stem（已 ü→v 归一），如 b→'bo1'、zh→'zhi1'
  audioSyllable: string
  // 是否可进入 BlendBuilder 拼读；y/w 为零声母拼写约定，标 false
  canBlend: boolean
}

// 韵母（display / canonical / audio 三态分离）
export interface Final {
  id: string // 稳定 id，用 canonical 形，如 'uei'、'ang'
  displayFinal: string // 孩子看到的形，如 'ui'
  canonicalFinal: string // 拼读内部形，如 'uei'
  // 代表音音频 stem（已 ü→v 归一），如 a→'a1'、ui→'wei1'、ong→'ong'
  audioRepresentative: string
  // 当代表音是“例音节”而非韵母本音时，高亮的韵母子串，如 'ong'
  highlightFinal?: string
  category: FinalCategory
}

// 整体认读音节
export interface WholeSyllable {
  id: string // 'zhi'
  syllable: string // 'zhi'
  audioKey: string // 'zhi1'
}

// “认字母”线性序列中的一项
export type LetterEntry =
  | { kind: 'initial'; data: Initial }
  | { kind: 'final'; data: Final }
  | { kind: 'whole'; data: WholeSyllable }

// 例字 / 词（用于“汉字练习”阶段，人工白名单）
export interface ExampleWord {
  hanzi: string // '妈'（单字优先，避开多音字）
  pinyin: string // 'mā'
  // cmn-{hanzi}.mp3 的文件名主体即汉字本身（取用时 URL 编码）
}

// toSyllable 的结构化返回
export interface SyllableResult {
  display: string // 'mā'（带调符号）
  audioKey: string // 'ma1'（文件 stem，已 ü→v 归一）
  base: string // 'ma'（无调）
  tone: Tone
}

// 学习进度（localStorage，Record 去重 + version 迁移）
export interface PinyinProgress {
  version: number
  learned: Record<string, number> // 字母/音节 id → 首次学过时间戳
  characterCorrect: Record<string, number> // 认读练习每字答对次数
}

export const PINYIN_PROGRESS_VERSION = 1
