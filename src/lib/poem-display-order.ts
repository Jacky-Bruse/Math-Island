import type { Poem } from '../types/poem'

export function getPoemsInDisplayOrder(poems: Poem[]): Poem[] {
  return [...poems]
}
