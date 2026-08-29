import { useCallback, useEffect, useRef } from 'react'
import { syllabUrl, letterUrl, blendUrl, hanziUrl } from '../lib/pinyin-audio'

// 拼音真人录音播放：用 fetch 取完整 blob → objectURL → new Audio 播放，
// 彻底避开 Range/206 的离线缓存问题；缓存 objectURL，unmount 时统一 revoke。
// soundOn 来自 settings.sound，关闭时不出声。

export function usePinyinAudio(soundOn: boolean) {
  const cacheRef = useRef<Map<string, string>>(new Map()) // 源 url → objectURL
  const pendingRef = useRef<Map<string, Promise<string | null>>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundRef = useRef(soundOn)
  const playTokenRef = useRef(0) // 新的播放会让旧的异步加载失效
  const aliveRef = useRef(true) // 组件是否仍挂载（避免卸载后 fetch 完成创建悬挂 objectURL）

  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])

  const stop = useCallback(() => {
    playTokenRef.current++
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const resolve = useCallback((url: string): Promise<string | null> => {
    const cached = cacheRef.current.get(url)
    if (cached) return Promise.resolve(cached)
    const pending = pendingRef.current.get(url)
    if (pending) return pending

    const request = (async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) return null // 404 兜底：静默
        const blob = await res.blob()
        const obj = URL.createObjectURL(blob)
        if (!aliveRef.current) {
          // 卸载后 fetch 才完成：立即释放，不写入已清空的缓存
          URL.revokeObjectURL(obj)
          return null
        }
        cacheRef.current.set(url, obj)
        return obj
      } catch {
        return null
      } finally {
        pendingRef.current.delete(url)
      }
    })()
    pendingRef.current.set(url, request)
    return request
  }, [])

  const preloadUrls = useCallback(async (urls: string[]): Promise<void> => {
    if (!soundRef.current) return
    const uniqueUrls = [...new Set(urls)]
    for (let index = 0; index < uniqueUrls.length; index += 4) {
      if (!aliveRef.current || !soundRef.current) return
      await Promise.all(uniqueUrls.slice(index, index + 4).map(resolve))
    }
  }, [resolve])

  const playUrl = useCallback(async (url: string): Promise<void> => {
    if (!soundRef.current) return
    stop()
    const token = playTokenRef.current
    const obj = await resolve(url)
    if (!obj || !soundRef.current || token !== playTokenRef.current) return
    const audio = new Audio(obj)
    audioRef.current = audio
    try {
      await audio.play()
    } catch {
      // 自动播放被拦截等，忽略
    }
  }, [resolve, stop])

  const playSyllab = useCallback((audioKey: string) => playUrl(syllabUrl(audioKey)), [playUrl])
  const playLetter = useCallback((audioKey: string) => playUrl(letterUrl(audioKey)), [playUrl])
  const playBlend = useCallback((audioKey: string) => playUrl(blendUrl(audioKey)), [playUrl])
  const playHanzi = useCallback((hanzi: string) => playUrl(hanziUrl(hanzi)), [playUrl])
  const preloadLetter = useCallback(
    (audioKeys: string[]) => soundOn ? preloadUrls(audioKeys.map(letterUrl)) : Promise.resolve(),
    [preloadUrls, soundOn],
  )
  const preloadBlend = useCallback(
    (audioKeys: string[]) => soundOn ? preloadUrls(audioKeys.map(blendUrl)) : Promise.resolve(),
    [preloadUrls, soundOn],
  )

  useEffect(() => {
    const cache = cacheRef.current
    const pending = pendingRef.current
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      // 递增令牌使进行中的异步加载在卸载后失效（计数器，非 DOM 节点）
      // eslint-disable-next-line react-hooks/exhaustive-deps
      playTokenRef.current++
      if (audioRef.current) {
        audioRef.current.onended = null
        audioRef.current.onerror = null
        audioRef.current.pause()
        audioRef.current = null
      }
      for (const obj of cache.values()) URL.revokeObjectURL(obj)
      cache.clear()
      pending.clear()
    }
  }, [])

  return { playSyllab, playLetter, playBlend, playHanzi, preloadLetter, preloadBlend }
}
