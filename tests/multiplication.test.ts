import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildMultiplicationPracticePrompt,
  generateMultiplicationPracticeItem,
  getMultiplicationFact,
  getMultiplicationFacts,
  getMultiplicationFactsByGroup,
  getMultiplicationFactsUpToLevel,
  getMultiplicationDemoMode,
  getMultiplicationNavigation,
} from '../src/lib/multiplication.ts'

test('builds full multiplication reading order by group then within-group order', () => {
  const facts = getMultiplicationFacts()

  assert.equal(facts.length, 45)
  assert.deepEqual(
    facts.slice(0, 6).map(fact => fact.chant),
    ['一一得一', '一二得二', '二二得四', '一三得三', '二三得六', '三三得九'],
  )
  assert.equal(facts.at(-1)?.chant, '九九八十一')
})

test('returns the selected group in ascending within-group order', () => {
  const group = getMultiplicationFactsByGroup(7)

  assert.deepEqual(
    group.map(fact => fact.chant),
    ['一七得七', '二七十四', '三七二十一', '四七二十八', '五七三十五', '六七四十二', '七七四十九'],
  )
})

test('maps a multiplication fact to the agreed understanding model', () => {
  const fact = getMultiplicationFact(3, 4)

  assert.equal(fact.answer, 12)
  assert.equal(fact.group, 4)
  assert.equal(fact.meaningText, '4个3')
  assert.equal(fact.groups, 4)
  assert.equal(fact.itemsPerGroup, 3)
  assert.equal(fact.chant, '三四十二')
})

test('builds cumulative practice ranges up to the selected level', () => {
  const facts = getMultiplicationFactsUpToLevel(3)

  assert.equal(facts.length, 6)
  assert.deepEqual(
    facts.map(fact => fact.chant),
    ['一一得一', '一二得二', '二二得四', '一三得三', '二三得六', '三三得九'],
  )
})

test('switches demo mode by total count thresholds', () => {
  assert.equal(getMultiplicationDemoMode(20), 'all-numbered')
  assert.equal(getMultiplicationDemoMode(21), 'compact-numbered')
  assert.equal(getMultiplicationDemoMode(45), 'compact-numbered')
  assert.equal(getMultiplicationDemoMode(46), 'grouped')
  assert.equal(getMultiplicationDemoMode(81), 'grouped')
})

test('navigates according to the global full-reading order', () => {
  const navigation = getMultiplicationNavigation(3, 4)

  assert.equal(navigation.current.chant, '三四十二')
  assert.equal(navigation.previous?.chant, '二四得八')
  assert.equal(navigation.next?.chant, '四四十六')
})

test('formats the supported practice prompt styles consistently', () => {
  const fact = getMultiplicationFact(3, 4)

  assert.deepEqual(buildMultiplicationPracticePrompt(fact, 'equation'), {
    kind: 'equation',
    prompt: '3 × 4 = ?',
    answer: '12',
  })
  assert.deepEqual(buildMultiplicationPracticePrompt(fact, 'chant-forward'), {
    kind: 'chant-forward',
    prompt: '三四得 ?',
    answer: '12',
  })
  assert.deepEqual(buildMultiplicationPracticePrompt(fact, 'chant-reverse'), {
    kind: 'chant-reverse',
    prompt: '?四十二',
    answer: '3',
  })
})

test('generates practice items only from the cumulative selected level', () => {
  const item = generateMultiplicationPracticeItem(2, () => 0.99)

  assert.equal(item.fact.b <= 2, true)
  assert.equal(['equation', 'chant-forward', 'chant-reverse'].includes(item.prompt.kind), true)
})
