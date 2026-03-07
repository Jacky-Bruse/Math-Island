import test from 'node:test'
import assert from 'node:assert/strict'

import { getPoemNavigationContext } from '../src/lib/poem-navigation.ts'

const poems = [
  {
    id: 'poem-3',
    title: '静夜思',
    author: '李白',
    dynasty: '唐',
    content: '床前明月光',
    createdAt: 3,
    updatedAt: 300,
  },
  {
    id: 'poem-2',
    title: '春晓',
    author: '孟浩然',
    dynasty: '唐',
    content: '春眠不觉晓',
    createdAt: 2,
    updatedAt: 200,
  },
  {
    id: 'poem-1',
    title: '登鹳雀楼',
    author: '王之涣',
    dynasty: '唐',
    content: '白日依山尽',
    createdAt: 1,
    updatedAt: 100,
  },
]

test('returns previous and next poem around the current poem', () => {
  const result = getPoemNavigationContext(poems, 'poem-2')

  assert.equal(result.total, 3)
  assert.equal(result.index, 1)
  assert.equal(result.previous?.id, 'poem-3')
  assert.equal(result.previous?.title, '静夜思')
  assert.equal(result.next?.id, 'poem-1')
  assert.equal(result.next?.title, '登鹳雀楼')
})

test('disables previous on the first poem', () => {
  const result = getPoemNavigationContext(poems, 'poem-3')

  assert.equal(result.index, 0)
  assert.equal(result.previous, null)
  assert.equal(result.next?.id, 'poem-2')
})

test('disables next on the last poem', () => {
  const result = getPoemNavigationContext(poems, 'poem-1')

  assert.equal(result.index, 2)
  assert.equal(result.previous?.id, 'poem-2')
  assert.equal(result.next, null)
})

test('returns null when current poem is not found', () => {
  const result = getPoemNavigationContext(poems, 'missing-id')

  assert.equal(result, null)
})
