import { useState, useRef, useCallback, useEffect } from 'react'
import type { Poem } from '../types/poem'
import type { Settings } from '../types/settings'
import type { PoemSegment } from '../types/poem'
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

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cacheRef = useRef<Map<string, string>>(new Map())
  const preloadRef = useRef<{ index: number; promise: Promise<string> | null }>({ index: -1, promise: null })
  const stateRef = useRef<PlaybackState>('idle')
  const currentIndexRef = useRef(-1)

  // 同步 ref
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  // 构建 segments
  useEffect(() => {
    if (!poem) {
      setSegments([])
      return
    }
    setSegments(buildSegments(poem, settings))
  }, [poem, settings.poemReadTitle, settings.poemReadMeta])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      // 释放所有 blob URL
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      cacheRef.current.clear()
    }
  }, [])

  // poem 变化时重置
  useEffect(() => {
    stopPlayback()
    // 释放旧缓存
    for (const url of cacheRef.current.values()) {
      URL.revokeObjectURL(url)
    }
    cacheRef.current.clear()
  }, [poem?.id])

  const getAudioUrl = useCallback(async (text: string, retries = 1): Promise<string> => {
    const key = cacheKey(text, settings.poemTtsVoice, settings.poemTtsRate, settings.poemTtsPitch)
    const cached = cacheRef.current.get(key)
    if (cached) return cached

    try {
      const baseUrl = getTtsBaseUrl(settings)
      const blob = await synthesizeSpeech(baseUrl, text, settings.poemTtsVoice, settings.poemTtsRate, settings.poemTtsPitch)
      const url = URL.createObjectURL(blob)
      cacheRef.current.set(key, url)
      return url
    } catch (err) {
      if (retries > 0) {
        return getAudioUrl(text, retries - 1)
      }
      throw err
    }
  }, [settings.poemTtsVoice, settings.poemTtsRate, settings.poemTtsPitch, settings.poemTtsUseCustomService, settings.poemTtsServiceUrl])

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
      setState('finished')
      setCurrentIndex(segments.length - 1)
      return
    }

    // 停止当前音频
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setCurrentIndex(index)
    setError(null)

    try {
      let url: string | null = null
      // 检查预加载
      if (preloadRef.current.index === index && preloadRef.current.promise) {
        url = await preloadRef.current.promise
      }
      // 预加载失败或未命中时回退到实时请求
      if (!url) {
        url = await getAudioUrl(segments[index].text)
      }

      // 播放可能已被用户停止
      if (stateRef.current === 'idle') return

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => {
        setState('playing')
        // 预加载下一句
        preloadNext(index + 1)
      }

      audio.onended = () => {
        const nextIdx = currentIndexRef.current + 1
        if (nextIdx < segments.length) {
          playSegment(nextIdx)
        } else {
          setState('finished')
        }
      }

      audio.onerror = () => {
        setError('音频播放失败')
        setState('idle')
      }

      setState('playing')
      await audio.play()
    } catch {
      setError('语音合成失败，请检查 TTS 服务')
      setState('idle')
    }
  }, [segments, getAudioUrl, preloadNext])

  const play = useCallback(() => {
    if (!settings.poemTtsEnabled || segments.length === 0) return
    setState('playing')
    playSegment(0)
  }, [settings.poemTtsEnabled, segments, playSegment])

  const pause = useCallback(() => {
    if (audioRef.current && stateRef.current === 'playing') {
      audioRef.current.pause()
      setState('paused')
    }
  }, [])

  const resume = useCallback(() => {
    if (audioRef.current && stateRef.current === 'paused') {
      audioRef.current.play()
      setState('playing')
    }
  }, [])

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setState('idle')
    setCurrentIndex(-1)
    setError(null)
    preloadRef.current = { index: -1, promise: null }
  }, [])

  const next = useCallback(() => {
    if (segments.length === 0) return
    const nextIdx = currentIndexRef.current + 1
    if (nextIdx < segments.length) {
      setState('playing')
      playSegment(nextIdx)
    }
  }, [segments, playSegment])

  const prev = useCallback(() => {
    if (segments.length === 0) return
    const prevIdx = currentIndexRef.current - 1
    if (prevIdx >= 0) {
      setState('playing')
      playSegment(prevIdx)
    }
  }, [segments, playSegment])

  const replay = useCallback(() => {
    if (segments.length === 0 || currentIndexRef.current < 0) return
    setState('playing')
    playSegment(currentIndexRef.current)
  }, [segments, playSegment])

  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= segments.length) return
    setState('playing')
    playSegment(index)
  }, [segments, playSegment])

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
