import { useState, useCallback } from 'react'
import type { SudokuSize, SudokuPuzzle } from '../types/sudoku'
import { getAllConflicts, isBoardComplete, getHint } from '../lib/sudoku-engine'
import { getRandomPuzzle } from '../lib/sudoku-puzzles'
import { getRecentPuzzleIds, addRecentPuzzleId } from '../lib/db'

interface SudokuState {
  puzzle: SudokuPuzzle | null
  board: number[][]
  selectedRow: number | null
  selectedCol: number | null
  conflicts: Set<string>
  hintsRemaining: number
  isComplete: boolean
  loading: boolean
  highlightedCell: { row: number; col: number } | null
}

export function useSudoku(size: SudokuSize) {
  const [state, setState] = useState<SudokuState>({
    puzzle: null,
    board: [],
    selectedRow: null,
    selectedCol: null,
    conflicts: new Set(),
    hintsRemaining: 3,
    isComplete: false,
    loading: true,
    highlightedCell: null,
  })

  const loadNewPuzzle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    const recentIds = await getRecentPuzzleIds(size)
    const { puzzle, index } = await getRandomPuzzle(size, recentIds)
    await addRecentPuzzleId(size, index)

    setState({
      puzzle,
      board: puzzle.givens.map(row => [...row]),
      selectedRow: null,
      selectedCol: null,
      conflicts: new Set(),
      hintsRemaining: 3,
      isComplete: false,
      loading: false,
      highlightedCell: null,
    })
  }, [size])

  const restoreFromDraft = useCallback((draft: {
    givens: number[][]
    solution: number[][]
    board: number[][]
    hintsRemaining: number
  }) => {
    const puzzle: SudokuPuzzle = {
      size,
      givens: draft.givens,
      solution: draft.solution,
    }
    const conflicts = getAllConflicts(draft.board, size)
    setState({
      puzzle,
      board: draft.board,
      selectedRow: null,
      selectedCol: null,
      conflicts,
      hintsRemaining: draft.hintsRemaining,
      isComplete: false,
      loading: false,
      highlightedCell: null,
    })
  }, [size])

  const selectCell = useCallback((row: number, col: number) => {
    setState(prev => {
      if (!prev.puzzle || prev.puzzle.givens[row][col] !== 0) {
        return { ...prev, selectedRow: row, selectedCol: col }
      }
      return { ...prev, selectedRow: row, selectedCol: col, highlightedCell: null }
    })
  }, [])

  const placeNumber = useCallback((num: number) => {
    setState(prev => {
      if (!prev.puzzle || prev.selectedRow === null || prev.selectedCol === null) return prev
      if (prev.puzzle.givens[prev.selectedRow][prev.selectedCol] !== 0) return prev

      const newBoard = prev.board.map(row => [...row])
      newBoard[prev.selectedRow][prev.selectedCol] = num
      const conflicts = getAllConflicts(newBoard, size)

      return { ...prev, board: newBoard, conflicts }
    })
  }, [size])

  const eraseCell = useCallback(() => {
    setState(prev => {
      if (!prev.puzzle || prev.selectedRow === null || prev.selectedCol === null) return prev
      if (prev.puzzle.givens[prev.selectedRow][prev.selectedCol] !== 0) return prev

      const newBoard = prev.board.map(row => [...row])
      newBoard[prev.selectedRow][prev.selectedCol] = 0
      const conflicts = getAllConflicts(newBoard, size)

      return { ...prev, board: newBoard, conflicts }
    })
  }, [size])

  const checkComplete = useCallback((): boolean => {
    if (!state.puzzle) return false
    const complete = isBoardComplete(state.board, size)
    if (complete) {
      setState(prev => ({ ...prev, isComplete: true }))
    }
    return complete
  }, [state.puzzle, state.board, size])

  const useHint = useCallback(() => {
    setState(prev => {
      if (!prev.puzzle || prev.hintsRemaining <= 0) return prev

      const hint = getHint(prev.board, prev.puzzle.solution, prev.puzzle.givens, size, prev.selectedRow, prev.selectedCol)
      if (!hint) return prev

      if (hint.type === 'reveal' && hint.value !== undefined) {
        const newBoard = prev.board.map(row => [...row])
        newBoard[hint.row][hint.col] = hint.value
        const conflicts = getAllConflicts(newBoard, size)
        return {
          ...prev,
          board: newBoard,
          conflicts,
          hintsRemaining: prev.hintsRemaining - 1,
          highlightedCell: { row: hint.row, col: hint.col },
        }
      }

      return {
        ...prev,
        hintsRemaining: prev.hintsRemaining - 1,
        highlightedCell: { row: hint.row, col: hint.col },
        selectedRow: hint.row,
        selectedCol: hint.col,
      }
    })
  }, [size])

  return {
    ...state,
    selectCell,
    placeNumber,
    eraseCell,
    checkComplete,
    useHint,
    loadNewPuzzle,
    restoreFromDraft,
  }
}
