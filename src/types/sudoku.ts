export type SudokuSize = 4 | 6 | 8

export interface SudokuPuzzle {
  size: SudokuSize
  givens: number[][]
  solution: number[][]
}

export interface SudokuConflict {
  row: number
  col: number
}

export interface SudokuDraft {
  size: SudokuSize
  givens: number[][]
  solution: number[][]
  board: number[][]
  hintsRemaining: number
  timestamp: number
}

export const BOX_SIZES: Record<SudokuSize, [number, number]> = {
  4: [2, 2],
  6: [2, 3],
  8: [2, 4],
}
