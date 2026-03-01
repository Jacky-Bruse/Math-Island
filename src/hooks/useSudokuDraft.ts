import { useCallback } from 'react'
import { saveDraft, loadDraft, deleteDraft, hasDraft } from '../lib/db'
import type { SudokuSize } from '../types/sudoku'

export function useSudokuDraft(size: SudokuSize) {
  const save = useCallback(async (
    givens: number[][],
    solution: number[][],
    board: number[][],
    hintsRemaining: number,
  ) => {
    await saveDraft(size, givens, solution, board, hintsRemaining)
  }, [size])

  const load = useCallback(async () => {
    return loadDraft(size)
  }, [size])

  const remove = useCallback(async () => {
    await deleteDraft(size)
  }, [size])

  const check = useCallback(async () => {
    return hasDraft(size)
  }, [size])

  return { save, load, remove, check }
}
