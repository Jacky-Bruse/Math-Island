import { useState, useRef, useCallback, useEffect } from 'react'
import type { Poem, PoemSegment } from '../types/poem'
import type { Settings } from '../types/settings'
import { getInterSegmentPauseMs } from '../lib/poem-tts-playback'
import { buildSegments, synthesizeSpeech, getTtsBaseUrl } from '../lib/tts'

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished'

interface UsePoemTtsReturn {
  state: PlaybackState
  segments: PoemSegment[]
  currentIndex: number
  play: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  next: () => void
  prev: () => void
  replay: () => void
  jumpTo: (index: number) => void
  error: string | null
}

function cacheKey(text: string, voice: string, rate: number, pitch: number): string {
  return `${text}|${voice}|${rate}|${pitch}`
}

export function usePoemTts(poem: Poem | null, settings: Settings): UsePoemTtsReturn {
  const [state, setState] = useState<PlaybackState>('idle')
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<PoemSegment[]>([])
  const {
    poemReadTitle,
    poemReadMeta,
    poemTtsEnabled,
    poemTtsUseCustomService,
    poemTtsServiceUrl,
    poemTtsVoice,
    poemTtsRate,
    poemTtsPitch,
    poemTtsMode,
    poemTtsFollowPauseSeconds,
  } = settings

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef<Map<string, string>>(new Map())
  const preloadRef = useRef<{ index: number; promise: Promise<string> | null }>({ index: -1, promise: null })
  const pendingNextRef = useRef<{ index: number; timeoutId: number | null }>({ index: -1, timeoutId: null })
  const stateRef = useRef<PlaybackState>('idle')
  const currentIndexRef = useRef(-1)

  const clearPendingNext = useCallback(() => {
    if (pendingNextRef.current.timeoutId !== null) {
      window.clearTimeout(pendingNextRef.current.timeoutId)
    }
    pendingNextRef.current = { index: -1, timeoutId: null }
  }, [])

  const stopPlayback = useCallback(() => {
    clearPendingNext()
    if (audioRef.current) {
      audioRef.current.onplay = null
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }
    // 同步写 ref：playSegment 的 await 之后立即读取，不能等 effect
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
    if (!poem) {
      setSegments([])
      return
    }
    setSegments(buildSegments(poem, { poemReadTitle, poemReadMeta }))
  }, [poem, poemReadTitle, poemReadMeta])

  useEffect(() => {
    const cache = cacheRef.current

    return () => {
      stateRef.current = 'idle'
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

  useEffect(() => {
    stopPlayback()
    const cache = cacheRef.current
    for (const url of cache.values()) {
      URL.revokeObjectURL(url)
    }
    cache.clear()
  }, [poem?.id, stopPlayback])

  const getAudioUrl = useCallback(async (text: string, retries = 1): Promise<string> => {
    const key = cacheKey(text, poemTtsVoice, poemTtsRate, poemTtsPitch)
    const cached = cacheRef.current.get(key)
    if (cached) return cached

    try {
      const baseUrl = getTtsBaseUrl({ poemTtsUseCustomService, poemTtsServiceUrl })
      const blob = await synthesizeSpeech(baseUrl, text, poemTtsVoice, poemTtsRate, poemTtsPitch)
      const url = URL.createObjectURL(blob)
      cacheRef.current.set(key, url)
      return url
    } catch (err) {
      if (retries > 0) {
        return getAudioUrl(text, retries - 1)
      }
      throw err
    }
  }, [poemTtsVoice, poemTtsRate, poemTtsPitch, poemTtsUseCustomService, poemTtsServiceUrl])

  const preloadNext = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= segments.length) return
    const text = segments[nextIndex].text
    preloadRef.current = {
      index: nextIndex,
      promise: getAudioUrl(text).catch(() => null) as Promise<string>,
    }
  }, [segments, getAudioUrl])

  const playSegment = useCallback(async (index: number) => {
    if (index < 0 || index >= segments.length) {
      clearPendingNext()
      setState('finished')
      setCurrentIndex(segments.length - 1)
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
        url = await getAudioUrl(segments[index].text)
      }

      if (stateRef.current === 'idle') return
      if (stateRef.current === 'paused') {
        // 合成期间被暂停：记下待播段，resume 时从这里继续
        pendingNextRef.current = { index, timeoutId: null }
        return
      }

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => {
        setState('playing')
        preloadNext(index + 1)
      }

      audio.onended = () => {
        // 段已播完，置空避免暂停/继续把已结束的音频重播一遍
        if (audioRef.current === audio) audioRef.current = null
        const nextIdx = currentIndexRef.current + 1
        if (nextIdx < segments.length) {
          const pauseMs = getInterSegmentPauseMs(
            poemTtsMode,
            poemTtsFollowPauseSeconds,
            segments[index],
          )
          pendingNextRef.current = {
            index: nextIdx,
            timeoutId: window.setTimeout(() => {
              pendingNextRef.current = { index: -1, timeoutId: null }
              if (stateRef.current !== 'playing') return
              playSegment(nextIdx)
            }, pauseMs),
          }
        } else {
          clearPendingNext()
          setState('finished')
        }
      }

      audio.onerror = () => {
        setError('音频播放失败')
        setState('idle')
      }

      stateRef.current = 'playing'
      setState('playing')
      await audio.play()
    } catch {
      setError('语音合成失败，请检查 TTS 服务')
      stateRef.current = 'idle'
      setState('idle')
    }
  }, [
    segments,
    getAudioUrl,
    preloadNext,
    poemTtsMode,
    poemTtsFollowPauseSeconds,
    clearPendingNext,
  ])

  const markPlaying = useCallback(() => {
    stateRef.current = 'playing'
    setState('playing')
  }, [])

  const play = useCallback(() => {
    if (!poemTtsEnabled || segments.length === 0) return
    markPlaying()
    playSegment(0)
  }, [poemTtsEnabled, segments, playSegment, markPlaying])

  const pause = useCallback(() => {
    if (stateRef.current !== 'playing') return
    if (audioRef.current) {
      audioRef.current.pause()
      stateRef.current = 'paused'
      setState('paused')
      return
    }
    if (pendingNextRef.current.index >= 0) {
      const nextIndex = pendingNextRef.current.index
      clearPendingNext()
      pendingNextRef.current = { index: nextIndex, timeoutId: null }
    }
    // 没有音频也没有段间停顿（合成加载中）：仅标记暂停，playSegment 会兜住
    stateRef.current = 'paused'
    setState('paused')
  }, [clearPendingNext])

  const resume = useCallback(() => {
    if (stateRef.current !== 'paused') return
    if (audioRef.current) {
      audioRef.current.play()
      markPlaying()
      return
    }
    if (pendingNextRef.current.index >= 0) {
      const nextIndex = pendingNextRef.current.index
      pendingNextRef.current = { index: -1, timeoutId: null }
      markPlaying()
      playSegment(nextIndex)
      return
    }
    // 合成仍在加载中（暂停时还没来得及记录待播段）：恢复 playing，加载完成后自然续播
    markPlaying()
  }, [playSegment, markPlaying])

  const next = useCallback(() => {
    if (segments.length === 0) return
    const nextIdx = currentIndexRef.current + 1
    if (nextIdx < segments.length) {
      markPlaying()
      playSegment(nextIdx)
    }
  }, [segments, playSegment, markPlaying])

  const prev = useCallback(() => {
    if (segments.length === 0) return
    const prevIdx = currentIndexRef.current - 1
    if (prevIdx >= 0) {
      markPlaying()
      playSegment(prevIdx)
    }
  }, [segments, playSegment, markPlaying])

  const replay = useCallback(() => {
    if (segments.length === 0 || currentIndexRef.current < 0) return
    markPlaying()
    playSegment(currentIndexRef.current)
  }, [segments, playSegment, markPlaying])

  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= segments.length) return
    markPlaying()
    playSegment(index)
  }, [segments, playSegment, markPlaying])

  return {
    state,
    segments,
    currentIndex,
    play,
    pause,
    resume,
    stop: stopPlayback,
    next,
    prev,
    replay,
    jumpTo,
    error,
  }
}
