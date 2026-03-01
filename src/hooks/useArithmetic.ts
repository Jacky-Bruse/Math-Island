import { useState, useCallback } from 'react'
import type { ArithmeticProblem, ArithmeticRange } from '../types/arithmetic'
import { generateArithmeticProblem, getHint, getStepExplanation } from '../lib/arithmetic-generator'

interface ArithmeticState {
  problem: ArithmeticProblem
  input: string
  errorCount: number
  hintUsed: boolean
  hintMessage: string | null
  showStar: boolean
  completedCount: number
  isAutoAdvancing: boolean
}

export function useArithmetic(range: ArithmeticRange) {
  const [state, setState] = useState<ArithmeticState>(() => ({
    problem: generateArithmeticProblem(range, 0),
    input: '',
    errorCount: 0,
    hintUsed: false,
    hintMessage: null,
    showStar: false,
    completedCount: 0,
    isAutoAdvancing: false,
  }))

  const inputDigit = useCallback((digit: number) => {
    setState(prev => {
      if (prev.isAutoAdvancing) return prev
      const next = prev.input + digit
      if (next.length > 3) return prev
      return { ...prev, input: next, hintMessage: null }
    })
  }, [])

  const backspace = useCallback(() => {
    setState(prev => {
      if (prev.isAutoAdvancing) return prev
      return { ...prev, input: prev.input.slice(0, -1) }
    })
  }, [])

  const clear = useCallback(() => {
    setState(prev => {
      if (prev.isAutoAdvancing) return prev
      return { ...prev, input: '' }
    })
  }, [])

  const requestHint = useCallback(() => {
    setState(prev => {
      if (prev.hintUsed || prev.isAutoAdvancing) return prev
      return { ...prev, hintUsed: true, hintMessage: getHint(prev.problem) }
    })
  }, [])

  const confirm = useCallback((): { correct: boolean; isSubmit: boolean } => {
    const s = state
    if (s.isAutoAdvancing || s.input === '') return { correct: false, isSubmit: false }

    const answer = parseInt(s.input, 10)
    const correct = answer === s.problem.answer

    if (correct) {
      const nextCount = s.completedCount + 1
      setState(prev => ({
        ...prev,
        showStar: true,
        isAutoAdvancing: true,
      }))
      setTimeout(() => {
        setState({
          problem: generateArithmeticProblem(range, nextCount),
          input: '',
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
      const explanation = getStepExplanation(s.problem)
      const nextCount = s.completedCount + 1
      setState(prev => ({
        ...prev,
        errorCount: newErrorCount,
        hintMessage: explanation,
        input: '',
        isAutoAdvancing: true,
      }))
      setTimeout(() => {
        setState({
          problem: generateArithmeticProblem(range, nextCount),
          input: '',
          errorCount: 0,
          hintUsed: false,
          hintMessage: null,
          showStar: false,
          completedCount: nextCount,
          isAutoAdvancing: false,
        })
      }, 1300)
      return { correct: false, isSubmit: true }
    }

    setState(prev => ({
      ...prev,
      errorCount: newErrorCount,
      input: '',
      hintMessage: 'No，再试一次',
    }))
    return { correct: false, isSubmit: false }
  }, [state, range])

  return {
    problem: state.problem,
    input: state.input,
    errorCount: state.errorCount,
    hintUsed: state.hintUsed,
    hintMessage: state.hintMessage,
    showStar: state.showStar,
    completedCount: state.completedCount,
    isAutoAdvancing: state.isAutoAdvancing,
    inputDigit,
    backspace,
    clear,
    confirm,
    requestHint,
  }
}
