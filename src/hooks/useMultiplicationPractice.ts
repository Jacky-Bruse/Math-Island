import { useCallback, useEffect, useRef, useState } from 'react'
import type { MultiplicationFact, PracticeLevel } from '../types/multiplication'
import {
  buildMultiplicationPracticePrompt,
  generateMultiplicationPracticeItem,
  getMultiplicationFact,
} from '../lib/multiplication'

interface PracticeState {
  fact: MultiplicationFact
  prompt: string
  answer: string
  input: string
  errorCount: number
  hintUsed: boolean
  hintMessage: string | null
  showStar: boolean
  completedCount: number
  isAutoAdvancing: boolean
}

function createPracticeState(level: PracticeLevel, completedCount: number): PracticeState {
  const item = generateMultiplicationPracticeItem(level)

  return {
    fact: item.fact,
    prompt: item.prompt.prompt,
    answer: item.prompt.answer,
    input: '',
    errorCount: 0,
    hintUsed: false,
    hintMessage: null,
    showStar: false,
    completedCount,
    isAutoAdvancing: false,
  }
}

function getHintMessage(fact: MultiplicationFact): string {
  return `${fact.groups}组，每组${fact.itemsPerGroup}个，${fact.meaningText}，${fact.chant}`
}

function getFullExplanation(fact: MultiplicationFact): string {
  const reversePrompt = buildMultiplicationPracticePrompt(fact, 'chant-reverse').prompt
  const forwardPrompt = buildMultiplicationPracticePrompt(fact, 'chant-forward').prompt
  const equationPrompt = buildMultiplicationPracticePrompt(fact, 'equation').prompt

  return `${equationPrompt.replace('?', String(fact.answer))}；${forwardPrompt.replace('?', String(fact.answer))}；${reversePrompt.replace('?', String(fact.a))}`
}

export function useMultiplicationPractice(level: PracticeLevel) {
  const [state, setState] = useState<PracticeState>(() => createPracticeState(level, 0))
  const stateRef = useRef(state)
  const levelRef = useRef(level)
  const previousLevelRef = useRef(level)
  const pendingNextRef = useRef<number | null>(null)

  stateRef.current = state
  levelRef.current = level

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
      setState(createPracticeState(levelRef.current, nextCount))
    }, delay)
  }, [clearPendingNext])

  useEffect(() => {
    if (previousLevelRef.current === level) return
    previousLevelRef.current = level
    clearPendingNext()
    setState(createPracticeState(level, 0))
  }, [clearPendingNext, level])

  useEffect(() => {
    return () => {
      clearPendingNext()
    }
  }, [clearPendingNext])

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
      const fact = getMultiplicationFact(prev.fact.a, prev.fact.b)
      return { ...prev, hintUsed: true, hintMessage: getHintMessage(fact) }
    })
  }, [])

  const confirm = useCallback((): { correct: boolean; isSubmit: boolean } => {
    const current = stateRef.current
    if (current.isAutoAdvancing || current.input === '') return { correct: false, isSubmit: false }

    const correct = current.input === current.answer

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
        hintMessage: getFullExplanation(prev.fact),
        input: '',
        isAutoAdvancing: true,
      }))
      scheduleNext(nextCount, 1400)
      return { correct: false, isSubmit: true }
    }

    setState(prev => ({
      ...prev,
      errorCount: newErrorCount,
      input: '',
      hintMessage: '再试一次',
    }))
    return { correct: false, isSubmit: false }
  }, [scheduleNext])

  return {
    fact: state.fact,
    prompt: state.prompt,
    answer: state.answer,
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
