import { useState, useCallback } from 'react'
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

export function useComparison() {
  const [state, setState] = useState<ComparisonState>(() => ({
    problem: generateComparisonProblem(0),
    errorCount: 0,
    hintUsed: false,
    hintMessage: null,
    showStar: false,
    completedCount: 0,
    isAutoAdvancing: false,
  }))

  const answer = useCallback((choice: '>' | '<'): { correct: boolean; isSubmit: boolean } => {
    const s = state
    if (s.isAutoAdvancing) return { correct: false, isSubmit: false }

    const correct = choice === s.problem.correctAnswer

    if (correct) {
      const nextCount = s.completedCount + 1
      setState(prev => ({ ...prev, showStar: true, isAutoAdvancing: true }))
      setTimeout(() => {
        setState({
          problem: generateComparisonProblem(nextCount),
          errorCount: 0,
          hintUsed: false,
          hintMessage: null,
          showStar: false,
          completedCount: nextCount,
          isAutoAdvancing: false,
        })
      }, 800)
      return { correct: true, isSubmit: true }
    }

    const newErrorCount = s.errorCount + 1
    if (newErrorCount >= 2) {
      const hint = getComparisonHint(s.problem)
      const nextCount = s.completedCount + 1
      setState(prev => ({
        ...prev,
        errorCount: newErrorCount,
        hintMessage: hint,
        isAutoAdvancing: true,
      }))
      setTimeout(() => {
        setState({
          problem: generateComparisonProblem(nextCount),
          errorCount: 0,
          hintUsed: false,
          hintMessage: null,
          showStar: false,
          completedCount: nextCount,
          isAutoAdvancing: false,
        })
      }, 2500)
      return { correct: false, isSubmit: true }
    }

    setState(prev => ({
      ...prev,
      errorCount: newErrorCount,
      hintMessage: null,
    }))
    return { correct: false, isSubmit: false }
  }, [state])

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
