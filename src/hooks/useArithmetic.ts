import { useCallback, useEffect, useRef, useState } from 'react'
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

function createState(range: ArithmeticRange, completedCount: number): ArithmeticState {
  return {
    problem: generateArithmeticProblem(range, completedCount),
    input: '',
    errorCount: 0,
    hintUsed: false,
    hintMessage: null,
    showStar: false,
    completedCount,
    isAutoAdvancing: false,
  }
}

export function useArithmetic(range: ArithmeticRange) {
  const [state, setState] = useState<ArithmeticState>(() => createState(range, 0))
  const stateRef = useRef(state)
  const rangeRef = useRef(range)
  const pendingNextRef = useRef<number | null>(null)

  stateRef.current = state
  rangeRef.current = range

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
      setState(createState(rangeRef.current, nextCount))
    }, delay)
  }, [clearPendingNext])

  useEffect(() => () => clearPendingNext(), [clearPendingNext])

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
    const current = stateRef.current
    if (current.isAutoAdvancing || current.input === '') return { correct: false, isSubmit: false }

    const answer = parseInt(current.input, 10)
    const correct = answer === current.problem.answer

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
        hintMessage: getStepExplanation(prev.problem),
        input: '',
        isAutoAdvancing: true,
      }))
      scheduleNext(nextCount, 1300)
      return { correct: false, isSubmit: true }
    }

    setState(prev => ({
      ...prev,
      errorCount: newErrorCount,
      input: '',
      hintMessage: 'No，再试一次',
    }))
    return { correct: false, isSubmit: false }
  }, [scheduleNext])

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
