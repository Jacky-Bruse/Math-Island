import type { ComparisonProblem } from '../types/comparison'
import { shouldGenerateHard } from './difficulty'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateComparisonProblem(completedCount: number): ComparisonProblem {
  const wantSameTens = shouldGenerateHard(completedCount)

  for (let attempt = 0; attempt < 100; attempt++) {
    let left: number, right: number

    if (wantSameTens) {
      const tens = randInt(1, 9)
      const onesL = randInt(0, 9)
      let onesR = randInt(0, 9)
      if (onesR === onesL) onesR = (onesL + randInt(1, 8)) % 10
      left = tens * 10 + onesL
      right = tens * 10 + onesR
    } else {
      const tensL = randInt(1, 9)
      let tensR = randInt(1, 9)
      if (tensR === tensL) tensR = (tensL % 9) + 1
      left = tensL * 10 + randInt(0, 9)
      right = tensR * 10 + randInt(0, 9)
    }

    if (left === right) continue
    if (left < 10 || right < 10) continue

    const sameTens = Math.floor(left / 10) === Math.floor(right / 10)
    if (wantSameTens && !sameTens) continue
    if (!wantSameTens && sameTens) continue

    return {
      left,
      right,
      correctAnswer: left > right ? '>' : '<',
      sameTens,
    }
  }

  // Fallback
  return { left: 42, right: 31, correctAnswer: '>', sameTens: false }
}

export function getComparisonHint(problem: ComparisonProblem): string {
  const { left, right, sameTens } = problem
  const tensL = Math.floor(left / 10)
  const tensR = Math.floor(right / 10)

  if (!sameTens) {
    return `先看十位：${tensL} 和 ${tensR}，${tensL > tensR ? `${tensL} 更大` : `${tensR} 更大`}，所以 ${left} ${left > right ? '>' : '<'} ${right}`
  }

  const onesL = left % 10
  const onesR = right % 10
  return `十位一样都是 ${tensL}，再看个位：${onesL} 和 ${onesR}，${onesL > onesR ? `${onesL} 更大` : `${onesR} 更大`}，所以 ${left} ${left > right ? '>' : '<'} ${right}`
}
