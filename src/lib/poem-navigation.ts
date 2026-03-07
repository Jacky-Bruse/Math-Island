import type { Poem } from '../types/poem'

export interface PoemNavigationContext {
  index: number
  total: number
  current: Poem
  previous: Poem | null
  next: Poem | null
}

export function getPoemNavigationContext(
  poems: Poem[],
  currentId: string | undefined,
): PoemNavigationContext | null {
  if (!currentId) return null

  const index = poems.findIndex(poem => poem.id === currentId)
  if (index < 0) return null

  return {
    index,
    total: poems.length,
    current: poems[index],
    previous: index > 0 ? poems[index - 1] : null,
    next: index < poems.length - 1 ? poems[index + 1] : null,
  }
}
