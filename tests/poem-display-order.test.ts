import test from 'node:test'
import assert from 'node:assert/strict'

import { getPoemsInDisplayOrder } from '../src/lib/poem-display-order.ts'

test('keeps existing poems first and imported poems in markdown order', () => {
  const poems = [
    {
      id: 'existing-1',
      title: 'existing 1',
      content: 'content 1',
      createdAt: 1,
      updatedAt: 500,
    },
    {
      id: 'existing-2',
      title: 'existing 2',
      content: 'content 2',
      createdAt: 2,
      updatedAt: 400,
    },
    {
      id: 'imported-1',
      title: 'imported 1',
      content: 'content 3',
      createdAt: 3,
      updatedAt: 300,
    },
    {
      id: 'imported-2',
      title: 'imported 2',
      content: 'content 4',
      createdAt: 4,
      updatedAt: 200,
    },
  ]

  const ordered = getPoemsInDisplayOrder(poems)

  assert.deepEqual(
    ordered.map(poem => poem.id),
    ['existing-1', 'existing-2', 'imported-1', 'imported-2'],
  )
})

test('does not mutate the original poems array', () => {
  const poems = [
    {
      id: 'poem-1',
      title: 'first',
      content: 'content',
      createdAt: 1,
      updatedAt: 200,
    },
    {
      id: 'poem-2',
      title: 'second',
      content: 'content',
      createdAt: 2,
      updatedAt: 100,
    },
  ]

  const ordered = getPoemsInDisplayOrder(poems)

  assert.notEqual(ordered, poems)
  assert.deepEqual(
    poems.map(poem => poem.id),
    ['poem-1', 'poem-2'],
  )
})
