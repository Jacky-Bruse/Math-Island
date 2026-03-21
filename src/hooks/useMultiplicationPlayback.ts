import { useCallback, useEffect, useRef, useState } from 'react'
import type { Settings } from '../types/settings'
import type { MultiplicationFact, ReadingMode } from '../types/multiplication'

export type MultiplicationPlaybackState = 'idle' | 'playing' | 'paused' | 'finished'

interface QueueConfig {
  facts: MultiplicationFact[]
  mode: ReadingMode
  label: string
}

function getPauseMs(mode: ReadingMode, settings: Settings): number {
  if (mode === 'full-follow') {
    return Math.max(1000, Math.round(settings.poemTtsFollowPauseSeconds * 1000))
  }
  return 260
}

export function useMultiplicationPlayback(settings: Settings) {
  const [state, setState] = useState<MultiplicationPlaybackState>('idle')
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [queue, setQueue] = useState<QueueConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stateRef = useRef<MultiplicationPlaybackState>('idle')
  const queueRef = useRef<QueueConfig | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const pendingIndexRef = useRef<number | null>(null)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    clearPendingTimeout()
    pendingIndexRef.current = null
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setState('idle')
    setCurrentIndex(-1)
  }, [clearPendingTimeout])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    return () => {
      clearPendingTimeout()
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [clearPendingTimeout])

  const playIndex = useCallback((index: number) => {
    const activeQueue = queueRef.current
    if (!activeQueue || index < 0 || index >= activeQueue.facts.length) {
      clearPendingTimeout()
      pendingIndexRef.current = null
      setState('finished')
      return
    }

    clearPendingTimeout()
    pendingIndexRef.current = null
    setCurrentIndex(index)
    setState('playing')
    setError(null)

    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持朗读')
      setState('idle')
      return
    }

    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(activeQueue.facts[index].chant)
    utterance.lang = 'zh-CN'
    utterance.rate = settings.poemTtsRate
    utterance.pitch = settings.poemTtsPitch

    utterance.onend = () => {
      if (stateRef.current !== 'playing') return

      const nextIndex = index + 1
      if (nextIndex >= activeQueue.facts.length) {
        setState('finished')
        return
      }

      const pauseMs = getPauseMs(activeQueue.mode, settings)
      pendingIndexRef.current = nextIndex
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        pendingIndexRef.current = null
        playIndex(nextIndex)
      }, pauseMs)
    }

    utterance.onerror = () => {
      setError('朗读播放失败')
      setState('idle')
    }

    synth.speak(utterance)
  }, [clearPendingTimeout, settings])

  const start = useCallback((facts: MultiplicationFact[], mode: ReadingMode, label: string) => {
    const nextQueue = { facts, mode, label }
    setQueue(nextQueue)
    queueRef.current = nextQueue
    playIndex(0)
  }, [playIndex])

  const pause = useCallback(() => {
    if (!('speechSynthesis' in window)) return

    if (timeoutRef.current !== null) {
      clearPendingTimeout()
      setState('paused')
      return
    }

    if (stateRef.current === 'playing') {
      window.speechSynthesis.pause()
      setState('paused')
    }
  }, [clearPendingTimeout])

  const resume = useCallback(() => {
    if (!('speechSynthesis' in window)) return

    if (pendingIndexRef.current !== null) {
      const nextIndex = pendingIndexRef.current
      pendingIndexRef.current = null
      setState('playing')
      playIndex(nextIndex)
      return
    }

    if (stateRef.current === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
    }
  }, [playIndex])

  const replay = useCallback(() => {
    if (!queueRef.current) return
    playIndex(Math.max(currentIndex, 0))
  }, [currentIndex, playIndex])

  return {
    state,
    currentFact: currentIndex >= 0 ? queue?.facts[currentIndex] ?? null : null,
    currentIndex,
    queue,
    error,
    start,
    pause,
    resume,
    replay,
    stop,
  }
}
