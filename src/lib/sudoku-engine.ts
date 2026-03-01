import type { SudokuSize, SudokuConflict } from '../types/sudoku'
import { BOX_SIZES } from '../types/sudoku'

export function findConflicts(board: number[][], size: SudokuSize, row: number, col: number): SudokuConflict[] {
  const val = board[row][col]
  if (val === 0) return []

  const conflicts: SudokuConflict[] = []
  const [boxR, boxC] = BOX_SIZES[size]

  // Row
  for (let c = 0; c < size; c++) {
    if (c !== col && board[row][c] === val) {
      conflicts.push({ row, col: c })
    }
  }

  // Column
  for (let r = 0; r < size; r++) {
    if (r !== row && board[r][col] === val) {
      conflicts.push({ row: r, col })
    }
  }

  // Box
  const startRow = Math.floor(row / boxR) * boxR
  const startCol = Math.floor(col / boxC) * boxC
  for (let r = startRow; r < startRow + boxR; r++) {
    for (let c = startCol; c < startCol + boxC; c++) {
      if ((r !== row || c !== col) && board[r][c] === val) {
        conflicts.push({ row: r, col: c })
      }
    }
  }

  return conflicts
}

export function getAllConflicts(board: number[][], size: SudokuSize): Set<string> {
  const conflictSet = new Set<string>()
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) {
        const conflicts = findConflicts(board, size, r, c)
        if (conflicts.length > 0) {
          conflictSet.add(`${r},${c}`)
          conflicts.forEach(cf => conflictSet.add(`${cf.row},${cf.col}`))
        }
      }
    }
  }
  return conflictSet
}

export function isBoardComplete(board: number[][], size: SudokuSize): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) return false
    }
  }
  return getAllConflicts(board, size).size === 0
}

export function getHint(
  board: number[][],
  solution: number[][],
  givens: number[][],
  size: SudokuSize,
  selectedRow: number | null,
  selectedCol: number | null,
): { type: 'conflict' | 'reveal' | 'suggest'; row: number; col: number; value?: number } | null {
  // 1. If there are conflicts, highlight first conflict
  const conflicts = getAllConflicts(board, size)
  if (conflicts.size > 0) {
    const first = Array.from(conflicts)[0].split(',').map(Number)
    return { type: 'conflict', row: first[0], col: first[1] }
  }

  // 2. If a cell is selected and empty, reveal its answer
  if (selectedRow !== null && selectedCol !== null && givens[selectedRow][selectedCol] === 0 && board[selectedRow][selectedCol] === 0) {
    return { type: 'reveal', row: selectedRow, col: selectedCol, value: solution[selectedRow][selectedCol] }
  }

  // 3. Find any empty cell and suggest it
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0 && givens[r][c] === 0) {
        return { type: 'suggest', row: r, col: c }
      }
    }
  }

  return null
}
