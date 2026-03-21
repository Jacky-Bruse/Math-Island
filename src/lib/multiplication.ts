import type {
  MultiplicationDemoMode,
  MultiplicationFact,
  MultiplicationGroup,
  MultiplicationPracticePrompt,
  MultiplicationPracticePromptKind,
  PracticeLevel,
} from '../types/multiplication'
import type { PoemSegment } from '../types/poem'

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const

function toChineseProduct(value: number): string {
  if (value < 10) return DIGITS[value]
  if (value === 10) return '十'
  if (value < 20) return `十${DIGITS[value % 10]}`

  const tens = Math.floor(value / 10)
  const ones = value % 10
  return `${DIGITS[tens]}十${ones === 0 ? '' : DIGITS[ones]}`
}

function createFact(a: number, b: MultiplicationGroup, order: number): MultiplicationFact {
  const answer = a * b
  return {
    a,
    b,
    answer,
    chant: `${DIGITS[a]}${DIGITS[b]}${answer < 10 ? '得' : ''}${toChineseProduct(answer)}`,
    group: b,
    order,
    groups: b,
    itemsPerGroup: a,
    meaningText: `${b}个${a}`,
  }
}

const FACTS: MultiplicationFact[] = Array.from({ length: 9 }, (_, groupIndex) => {
  const b = (groupIndex + 1) as MultiplicationGroup
  return Array.from({ length: b }, (_, itemIndex) => createFact(itemIndex + 1, b, 0))
}).flat().map((fact, index) => ({ ...fact, order: index }))

export function getMultiplicationFacts(): MultiplicationFact[] {
  return FACTS
}

export function getMultiplicationFactsByGroup(group: MultiplicationGroup): MultiplicationFact[] {
  return FACTS.filter(fact => fact.group === group)
}

export function getMultiplicationFact(a: number, b: MultiplicationGroup): MultiplicationFact {
  const fact = FACTS.find(item => item.a === a && item.b === b)
  if (!fact) {
    throw new Error(`Unknown multiplication fact: ${a} x ${b}`)
  }
  return fact
}

export function getMultiplicationFactsUpToLevel(level: PracticeLevel): MultiplicationFact[] {
  return FACTS.filter(fact => fact.group <= level)
}

export function getMultiplicationDemoMode(total: number): MultiplicationDemoMode {
  if (total <= 20) return 'all-numbered'
  if (total <= 45) return 'compact-numbered'
  return 'grouped'
}

export function getMultiplicationNavigation(a: number, b: MultiplicationGroup): {
  current: MultiplicationFact
  previous: MultiplicationFact | null
  next: MultiplicationFact | null
} {
  const current = getMultiplicationFact(a, b)
  const index = current.order

  return {
    current,
    previous: index > 0 ? FACTS[index - 1] : null,
    next: index < FACTS.length - 1 ? FACTS[index + 1] : null,
  }
}

export function formatMultiplicationEquation(fact: Pick<MultiplicationFact, 'a' | 'b' | 'answer'>): string {
  return `${fact.a}×${fact.b}=${fact.answer}`
}

export function buildMultiplicationReadingSegments(facts: MultiplicationFact[]): PoemSegment[] {
  return facts.map(fact => ({
    type: 'line',
    text: fact.chant,
  }))
}

export function buildMultiplicationPracticePrompt(
  fact: MultiplicationFact,
  kind: MultiplicationPracticePromptKind,
): MultiplicationPracticePrompt {
  switch (kind) {
    case 'equation':
      return {
        kind,
        prompt: `${fact.a} × ${fact.b} = ?`,
        answer: String(fact.answer),
      }
    case 'chant-forward':
      return {
        kind,
        prompt: `${DIGITS[fact.a]}${DIGITS[fact.b]}得 ?`,
        answer: String(fact.answer),
      }
    case 'chant-reverse':
      return {
        kind,
        prompt: `?${DIGITS[fact.b]}${toChineseProduct(fact.answer)}`,
        answer: String(fact.a),
      }
  }
}

const PRACTICE_KINDS: MultiplicationPracticePromptKind[] = ['equation', 'chant-forward', 'chant-reverse']

export function generateMultiplicationPracticeItem(
  level: PracticeLevel,
  random: () => number = Math.random,
): {
  fact: MultiplicationFact
  prompt: MultiplicationPracticePrompt
} {
  const facts = getMultiplicationFactsUpToLevel(level)
  const fact = facts[Math.floor(random() * facts.length)]
  const promptKind = PRACTICE_KINDS[Math.floor(random() * PRACTICE_KINDS.length)]

  return {
    fact,
    prompt: buildMultiplicationPracticePrompt(fact, promptKind),
  }
}
