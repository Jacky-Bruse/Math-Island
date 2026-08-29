import type { FinalCategory } from '../types/pinyin'

export const INITIAL_ROWS = [
  ['b', 'p', 'm', 'f'],
  ['d', 't', 'n', 'l'],
  ['g', 'k', 'h'],
  ['j', 'q', 'x'],
  ['zh', 'ch', 'sh', 'r'],
  ['z', 'c', 's'],
] as const

export const FINAL_GROUPS: ReadonlyArray<{
  category: FinalCategory
  title: string
  cue: string
  railClass: string
}> = [
  { category: 'single-final', title: '单韵母', cue: '一个口形，响亮读出', railClass: 'border-rose-400' },
  { category: 'compound-final', title: '复韵母', cue: '口形从前一个音滑向后一个音', railClass: 'border-amber-400' },
  { category: 'special-final', title: '特殊韵母', cue: 'er 单独记忆，不和声母相拼', railClass: 'border-orange-400' },
  { category: 'front-nasal-final', title: '前鼻韵母', cue: '舌尖抵住上齿龈收尾', railClass: 'border-violet-400' },
  { category: 'back-nasal-final', title: '后鼻韵母', cue: '舌根抬起，鼻音收尾', railClass: 'border-indigo-400' },
]
