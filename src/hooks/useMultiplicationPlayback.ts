import { useCallback, useEffect, useRef, useState } from 'react'
import { getInterSegmentPauseMs } from '../lib/poem-tts-playback'
import { getTtsBaseUrl, synthesizeSpeech } from '../lib/tts'
import type { Settings } from '../types/settings'
import type { MultiplicationFact, ReadingMode } from '../types/multiplication'

export type MultiplicationPlaybackState = 'idle' | 'playing' | 'paused' | 'finished'

interface QueueConfig {
  facts: MultiplicationFact[]
  mode: ReadingMode
  label: string
}

function cacheKey(text: string, voice: string, rate: number, pitch: number): string {
  return `${text}|${voice}|${rate}|${pitch}`
}

export function useMultiplicationPlayback(settings: Settings) {
  const [state, setState] = useState<MultiplicationPlaybackState>('idle')
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [queue, setQueue] = useState<QueueConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef<Map<string, string>>(new Map())
  const preloadRef = useRef<{ index: number; promise: Promise<string | null> | null }>({ index: -1, promise: null })
  const pendingNextRef = useRef<{ index: number; timeoutId: number | null }>({ index: -1, timeoutId: null })
  const queueRef = useRef<QueueConfig | null>(null)
  const currentIndexRef = useRef(-1)
  const stateRef = useRef<MultiplicationPlaybackState>('idle')

  const clearPendingNext = useCallback(() => {
    if (pendingNextRef.current.timeoutId !== null) {
      window.clearTimeout(pendingNextRef.current.timeoutId)
    }
    pendingNextRef.current = { index: -1, timeoutId: null }
  }, [])

  const stop = useCallback(() => {
    clearPendingNext()
    if (audioRef.current) {
      audioRef.current.onplay = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }
    stateRef.current = 'idle'
    setState('idle')
    setCurrentIndex(-1)
    setError(null)
    preloadRef.current = { index: -1, promise: null }
  }, [clearPendingNext])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    const cache = cacheRef.current

    return () => {
      clearPendingNext()
      if (audioRef.current) {
        audioRef.current.onplay = null
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current.pause()
        audioRef.current = null
      }
      for (const url of cache.values()) {
        URL.revokeObjectURL(url)
      }
      cache.clear()
    }
  }, [clearPendingNext])

  const getAudioUrl = useCallback(async (text: string, retries = 1): Promise<string> => {
    const key = cacheKey(text, settings.poemTtsVoice, settings.poemTtsRate, settings.poemTtsPitch)
    const cached = cacheRef.current.get(key)
    if (cached) return cached

    try {
      const baseUrl = getTtsBaseUrl({
        poemTtsUseCustomService: settings.poemTtsUseCustomService,
        poemTtsServiceUrl: settings.poemTtsServiceUrl,
      })
      const blob = await synthesizeSpeech(
        baseUrl,
        text,
        settings.poemTtsVoice,
        settings.poemTtsRate,
        settings.poemTtsPitch,
      )
      const url = URL.createObjectURL(blob)
      cacheRef.current.set(key, url)
      return url
    } catch (error) {
      if (retries > 0) {
        return getAudioUrl(text, retries - 1)
      }
      throw error
    }
  }, [
    settings.poemTtsPitch,
    settings.poemTtsRate,
    settings.poemTtsServiceUrl,
    settings.poemTtsUseCustomService,
    settings.poemTtsVoice,
  ])

  const preloadNext = useCallback((nextIndex: number) => {
    const activeQueue = queueRef.current
    if (!activeQueue || nextIndex < 0 || nextIndex >= activeQueue.facts.length) return

    preloadRef.current = {
      index: nextIndex,
      promise: getAudioUrl(activeQueue.facts[nextIndex].chant).catch(() => null),
    }
  }, [getAudioUrl])

  const playIndex = useCallback(async (index: number) => {
    const activeQueue = queueRef.current
    if (!activeQueue || index < 0 || index >= activeQueue.facts.length) {
      clearPendingNext()
      setState('finished')
      setCurrentIndex(activeQueue ? activeQueue.facts.length - 1 : -1)
      return
    }

    clearPendingNext()
    if (audioRef.current) {
      audioRef.current.onplay = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }

    setCurrentIndex(index)
    setError(null)

    try {
      let url: string | null = null
      if (preloadRef.current.index === index && preloadRef.current.promise) {
        url = await preloadRef.current.promise
      }
      if (!url) {
        url = await getAudioUrl(activeQueue.facts[index].chant)
      }

      if (stateRef.current === 'idle') return

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => {
        setState('playing')
        preloadNext(index + 1)
      }

      audio.onended = () => {
        const nextIndex = currentIndexRef.current + 1
        if (nextIndex < activeQueue.facts.length) {
          const pauseMs = getInterSegmentPauseMs(
            activeQueue.mode === 'full-follow' ? 'follow' : 'normal',
            settings.poemTtsFollowPauseSeconds,
            { type: 'line', text: activeQueue.facts[index].chant },
          )
          pendingNextRef.current = {
            index: nextIndex,
            timeoutId: window.setTimeout(() => {
              pendingNextRef.current = { index: -1, timeoutId: null }
              if (stateRef.current !== 'playing') return
              playIndex(nextIndex)
            }, pauseMs),
          }
        } else {
          clearPendingNext()
          setState('finished')
        }
      }

      audio.onerror = () => {
        setError('朗读播放失败')
        setState('idle')
      }

      setState('playing')
      await audio.play()
    } catch {
      setError('语音合成失败，请检查 TTS 服务')
      setState('idle')
    }
  }, [clearPendingNext, getAudioUrl, preloadNext, settings.poemTtsFollowPauseSeconds])

  const start = useCallback((facts: MultiplicationFact[], mode: ReadingMode, label: string) => {
    const nextQueue = { facts, mode, label }
    setQueue(nextQueue)
    queueRef.current = nextQueue
    stateRef.current = 'playing'
    setState('playing')
    playIndex(0)
  }, [playIndex])

  const pause = useCallback(() => {
    if (audioRef.current && stateRef.current === 'playing') {
      audioRef.current.pause()
      stateRef.current = 'paused'
      setState('paused')
      return
    }

    if (pendingNextRef.current.index >= 0 && stateRef.current === 'playing') {
      const nextIndex = pendingNextRef.current.index
      clearPendingNext()
      pendingNextRef.current = { index: nextIndex, timeoutId: null }
      stateRef.current = 'paused'
      setState('paused')
    }
  }, [clearPendingNext])

  const resume = useCallback(() => {
    if (audioRef.current && stateRef.current === 'paused') {
      void audioRef.current.play()
      stateRef.current = 'playing'
      setState('playing')
      return
    }

    if (pendingNextRef.current.index >= 0 && stateRef.current === 'paused') {
      const nextIndex = pendingNextRef.current.index
      pendingNextRef.current = { index: -1, timeoutId: null }
      stateRef.current = 'playing'
      setState('playing')
      void playIndex(nextIndex)
    }
  }, [playIndex])

  const replay = useCallback(() => {
    if (!queueRef.current || currentIndexRef.current < 0) return
    stateRef.current = 'playing'
    setState('playing')
    void playIndex(currentIndexRef.current)
  }, [playIndex])

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
