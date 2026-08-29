import { useCallback, useEffect, useRef } from 'react'
import { syllabUrl, letterUrl, blendUrl, hanziUrl } from '../lib/pinyin-audio'

// 拼音真人录音播放：用 fetch 取完整 blob → objectURL → new Audio 播放，
// 彻底避开 Range/206 的离线缓存问题；缓存 objectURL，unmount 时统一 revoke。
// soundOn 来自 settings.sound，关闭时不出声。

export function usePinyinAudio(soundOn: boolean) {
  const cacheRef = useRef<Map<string, string>>(new Map()) // 源 url → objectURL
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

  const resolve = useCallback(async (url: string): Promise<string | null> => {
    const cached = cacheRef.current.get(url)
    if (cached) return cached
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
    }
  }, [])

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

  useEffect(() => {
    const cache = cacheRef.current
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
    }
  }, [])

  return { playSyllab, playLetter, playBlend, playHanzi }
}
