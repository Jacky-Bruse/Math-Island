// 汉字认读练习出题（与静态数据解耦）。
import { EXAMPLE_WORDS } from './pinyin-data'
import type { ExampleWord } from '../types/pinyin'

export type PinyinQuestionKind = 'hear-char' | 'pinyin-char'

export interface PinyinQuestion {
  kind: PinyinQuestionKind
  target: ExampleWord
  options: ExampleWord[] // 含正确项，已打乱
}

function pick<T>(arr: T[], random: () => number): T {
  return arr[Math.floor(random() * arr.length)]
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const KINDS: PinyinQuestionKind[] = ['hear-char', 'pinyin-char']

export function generatePinyinQuestion(
  random: () => number = Math.random,
  optionCount = 4,
): PinyinQuestion {
  const kind = pick(KINDS, random)
  const target = pick(EXAMPLE_WORDS, random)

  // 干扰项：不同汉字、不同读音（避免同音失控）
  const pool = EXAMPLE_WORDS.filter(w => w.hanzi !== target.hanzi && w.pinyin !== target.pinyin)
  const distractors = shuffle(pool, random).slice(0, Math.max(0, optionCount - 1))
  const options = shuffle([target, ...distractors], random)

  return { kind, target, options }
}
