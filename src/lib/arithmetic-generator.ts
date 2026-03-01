import type { ArithmeticProblem, ArithmeticRange, Operator } from '../types/arithmetic'
import { shouldGenerateHard } from './difficulty'

function hasCarry(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return false
}

function hasBorrow(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) < (b % 10)) return true
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return false
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateArithmeticProblem(
  range: ArithmeticRange,
  completedCount: number,
): ArithmeticProblem {
  const wantHard = shouldGenerateHard(completedCount)
  const maxOperand = range === 100 ? 99 : range
  const maxResult = range

  for (let attempt = 0; attempt < 100; attempt++) {
    const operator: Operator = Math.random() < 0.5 ? '+' : '-'
    let a: number, b: number, answer: number

    if (operator === '+') {
      a = randInt(0, maxOperand)
      b = randInt(0, maxOperand)
      answer = a + b
      if (answer > maxResult) continue
    } else {
      a = randInt(0, maxOperand)
      b = randInt(0, a)
      answer = a - b
    }

    const isCarryOrBorrow = operator === '+' ? hasCarry(a, b) : hasBorrow(a, b)

    // For range 10/20, all are "basic" problems
    if (range <= 20) {
      return { a, b, operator, answer, isCarryOrBorrow }
    }

    // For range 100, apply difficulty filtering
    if (wantHard && !isCarryOrBorrow) continue
    if (!wantHard && isCarryOrBorrow) continue

    return { a, b, operator, answer, isCarryOrBorrow }
  }

  // Fallback: return any valid problem
  const operator: Operator = '+'
  const a = randInt(0, Math.min(5, maxOperand))
  const b = randInt(0, Math.min(5, maxOperand))
  return { a, b, operator, answer: a + b, isCarryOrBorrow: false }
}

export function getHint(problem: ArithmeticProblem): string {
  const { a, b, operator, isCarryOrBorrow } = problem

  if (operator === '+') {
    const onesA = a % 10
    const onesB = b % 10
    const onesSum = onesA + onesB

    if (isCarryOrBorrow) {
      return `先算个位：${onesA} + ${onesB} = ${onesSum}，个位写 ${onesSum % 10}，向十位进 1`
    }
    if (a >= 10 || b >= 10) {
      return `先算个位：${onesA} + ${onesB} = ${onesSum}，再算十位`
    }
    return `${a} + ${b}，数一数就知道啦`
  } else {
    const onesA = a % 10
    const onesB = b % 10

    if (isCarryOrBorrow) {
      return `个位 ${onesA} 不够减 ${onesB}，向十位借 1，个位变成 ${onesA + 10} - ${onesB} = ${onesA + 10 - onesB}`
    }
    if (a >= 10) {
      return `先算个位：${onesA} - ${onesB} = ${onesA - onesB}，再算十位`
    }
    return `${a} - ${b}，数一数就知道啦`
  }
}

export function getStepExplanation(problem: ArithmeticProblem): string {
  const { a, b, operator, answer } = problem

  if (operator === '+') {
    if (a < 10 && b < 10) {
      return `${a} + ${b} = ${answer}`
    }
    const tensA = Math.floor(a / 10)
    const onesA = a % 10
    const tensB = Math.floor(b / 10)
    const onesB = b % 10
    const onesSum = onesA + onesB
    const carry = onesSum >= 10 ? 1 : 0
    const tensSum = tensA + tensB + carry

    return `个位：${onesA} + ${onesB} = ${onesSum}${carry ? `，进1` : ''}；十位：${tensA} + ${tensB}${carry ? ' + 1' : ''} = ${tensSum}；结果：${answer}`
  } else {
    if (a < 10) {
      return `${a} - ${b} = ${answer}`
    }
    const tensA = Math.floor(a / 10)
    const onesA = a % 10
    const onesB = b % 10
    const tensB = Math.floor(b / 10)
    const borrow = onesA < onesB ? 1 : 0
    const onesResult = borrow ? (onesA + 10 - onesB) : (onesA - onesB)
    const tensResult = tensA - tensB - borrow

    return `个位：${borrow ? `${onesA} 借 1 变 ${onesA + 10}，` : ''}${borrow ? onesA + 10 : onesA} - ${onesB} = ${onesResult}；十位：${tensA}${borrow ? ' - 1' : ''} - ${tensB} = ${tensResult}；结果：${answer}`
  }
}
