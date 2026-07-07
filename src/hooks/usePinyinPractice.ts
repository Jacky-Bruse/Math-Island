import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePinyinQuestion } from '../lib/pinyin-practice'
import type { PinyinQuestion } from '../lib/pinyin-practice'

export type PracticeStatus = 'answering' | 'correct' | 'revealed'

export interface PinyinPracticeState {
  question: PinyinQuestion
  status: PracticeStatus
  errorCount: number
  wrongPicks: string[] // 选错的汉字
  completedCount: number // 做过的题数（含答错被揭示的）
  correctCount: number // 答对的题数
}

interface PickResult {
  correct: boolean
  revealed: boolean // 是否已给出答案（错满 2 次）
}

export function usePinyinPractice() {
  const [state, setState] = useState<PinyinPracticeState>(() => ({
    question: generatePinyinQuestion(),
    status: 'answering',
    errorCount: 0,
    wrongPicks: [],
    completedCount: 0,
    correctCount: 0,
  }))
  const stateRef = useRef(state)
  stateRef.current = state
  const advanceTimer = useRef<number | null>(null)

  const clearTimer = useCallback(() => {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
  }, [])

  const next = useCallback(() => {
    clearTimer()
    setState(prev => ({
      question: generatePinyinQuestion(),
      status: 'answering',
      errorCount: 0,
      wrongPicks: [],
      // 解决一题后才计数（纯函数：基于 prev）
      completedCount: prev.completedCount + (prev.status !== 'answering' ? 1 : 0),
      correctCount: prev.correctCount + (prev.status === 'correct' ? 1 : 0),
    }))
  }, [clearTimer])

  // 决策基于当前态（ref）在 updater 外完成，副作用/定时器不放进 setState updater
  const pickOption = useCallback((hanzi: string): PickResult => {
    const cur = stateRef.current
    if (cur.status !== 'answering') return { correct: false, revealed: false }

    if (hanzi === cur.question.target.hanzi) {
      setState(prev => (prev.status === 'answering' ? { ...prev, status: 'correct' } : prev))
      clearTimer()
      advanceTimer.current = window.setTimeout(next, 900)
      return { correct: true, revealed: false }
    }

    const errorCount = cur.errorCount + 1
    const wrongPicks = cur.wrongPicks.includes(hanzi) ? cur.wrongPicks : [...cur.wrongPicks, hanzi]
    if (errorCount >= 2) {
      setState(prev => (prev.status === 'answering' ? { ...prev, status: 'revealed', errorCount, wrongPicks } : prev))
      clearTimer()
      advanceTimer.current = window.setTimeout(next, 1500)
      return { correct: false, revealed: true }
    }

    setState(prev => (prev.status === 'answering' ? { ...prev, errorCount, wrongPicks } : prev))
    return { correct: false, revealed: false }
  }, [clearTimer, next])

  useEffect(() => () => clearTimer(), [clearTimer])

  return { state, pickOption, next }
}
