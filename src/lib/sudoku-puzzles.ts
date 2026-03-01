import type { SudokuSize, SudokuPuzzle } from '../types/sudoku'

const puzzleCache = new Map<SudokuSize, SudokuPuzzle[]>()

export async function loadPuzzles(size: SudokuSize): Promise<SudokuPuzzle[]> {
  if (puzzleCache.has(size)) return puzzleCache.get(size)!

  const response = await fetch(`/puzzles/sudoku-${size}x${size}.json`)
  const data = await response.json()
  const puzzles: SudokuPuzzle[] = data.map((p: { givens: number[][]; solution: number[][] }) => ({
    size,
    givens: p.givens,
    solution: p.solution,
  }))

  puzzleCache.set(size, puzzles)
  return puzzles
}

export async function getRandomPuzzle(size: SudokuSize, recentIds?: number[]): Promise<{ puzzle: SudokuPuzzle; index: number }> {
  const puzzles = await loadPuzzles(size)
  const excludeSet = new Set(recentIds || [])

  const available = puzzles
    .map((p, i) => ({ puzzle: p, index: i }))
    .filter(({ index }) => !excludeSet.has(index))

  if (available.length === 0) {
    // All excluded, pick random
    const index = Math.floor(Math.random() * puzzles.length)
    return { puzzle: puzzles[index], index }
  }

  const pick = available[Math.floor(Math.random() * available.length)]
  return pick
}
