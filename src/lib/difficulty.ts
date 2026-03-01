export function getDifficultyProgress(completedCount: number): number {
  const k = completedCount + 1
  return 1 - Math.exp(-k / 30)
}

export type DifficultyBucket = 'easy' | 'medium' | 'hard'

export function getDifficultyBucket(completedCount: number): DifficultyBucket {
  if (completedCount < 10) return 'easy'
  const p = getDifficultyProgress(completedCount)
  if (p < 0.4) return 'easy'
  if (p < 0.8) return 'medium'
  return 'hard'
}

export function shouldGenerateHard(completedCount: number): boolean {
  const bucket = getDifficultyBucket(completedCount)
  const roll = Math.random()

  switch (bucket) {
    case 'easy':
      return roll > 0.7
    case 'medium':
      return roll > 0.5
    case 'hard':
      return roll > 0.3
  }
}
