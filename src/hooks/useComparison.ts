import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComparisonProblem } from '../types/comparison'
import { generateComparisonProblem, getComparisonHint } from '../lib/comparison-generator'

interface ComparisonState {
  problem: ComparisonProblem
  errorCount: number
  hintUsed: boolean
  hintMessage: string | null
  showStar: boolean
  completedCount: number
  isAutoAdvancing: boolean
}

function createState(completedCount: number): ComparisonState {
  return {
    problem: generateComparisonProblem(completedCount),
    errorCount: 0,
    hintUsed: false,
    hintMessage: null,
    showStar: false,
    completedCount,
    isAutoAdvancing: false,
  }
}

export function useComparison() {
  const [state, setState] = useState<ComparisonState>(() => createState(0))
  const stateRef = useRef(state)
  const pendingNextRef = useRef<number | null>(null)

  stateRef.current = state

  const clearPendingNext = useCallback(() => {
    if (pendingNextRef.current !== null) {
      window.clearTimeout(pendingNextRef.current)
      pendingNextRef.current = null
    }
  }, [])

  const scheduleNext = useCallback((nextCount: number, delay: number) => {
    clearPendingNext()
    pendingNextRef.current = window.setTimeout(() => {
      pendingNextRef.current = null
      setState(createState(nextCount))
    }, delay)
  }, [clearPendingNext])

  useEffect(() => () => clearPendingNext(), [clearPendingNext])

  const answer = useCallback((choice: '>' | '<'): { correct: boolean; isSubmit: boolean } => {
    const current = stateRef.current
    if (current.isAutoAdvancing) return { correct: false, isSubmit: false }

    const correct = choice === current.problem.correctAnswer

    if (correct) {
      const nextCount = current.completedCount + 1
      setState(prev => ({ ...prev, showStar: true, isAutoAdvancing: true }))
      scheduleNext(nextCount, 800)
      return { correct: true, isSubmit: true }
    }

    const newErrorCount = current.errorCount + 1
    if (newErrorCount >= 2) {
      const nextCount = current.completedCount + 1
      setState(prev => ({
        ...prev,
        errorCount: newErrorCount,
        hintMessage: getComparisonHint(prev.problem),
        isAutoAdvancing: true,
      }))
      scheduleNext(nextCount, 1300)
      return { correct: false, isSubmit: true }
    }

    setState(prev => ({
      ...prev,
      errorCount: newErrorCount,
      hintMessage: 'No，再试一次',
    }))
    return { correct: false, isSubmit: false }
  }, [scheduleNext])

  const requestHint = useCallback(() => {
    setState(prev => {
      if (prev.hintUsed || prev.isAutoAdvancing) return prev
      return { ...prev, hintUsed: true, hintMessage: getComparisonHint(prev.problem) }
    })
  }, [])

  return {
    problem: state.problem,
    errorCount: state.errorCount,
    hintUsed: state.hintUsed,
    hintMessage: state.hintMessage,
    showStar: state.showStar,
    completedCount: state.completedCount,
    isAutoAdvancing: state.isAutoAdvancing,
    answer,
    requestHint,
  }
}
