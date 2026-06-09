import { useCallback, useEffect, useRef } from 'react'
import { syllabUrl, hanziUrl } from '../lib/pinyin-audio'

// 拼音真人录音播放：用 fetch 取完整 blob → objectURL → new Audio 播放，
// 彻底避开 Range/206 的离线缓存问题；缓存 objectURL，unmount 时统一 revoke。
// soundOn 来自 settings.sound，关闭时不出声。

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function usePinyinAudio(soundOn: boolean) {
  const cacheRef = useRef<Map<string, string>>(new Map()) // 源 url → objectURL
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundRef = useRef(soundOn)
  const seqRef = useRef(0) // 序列播放令牌，新的播放会让旧序列失效
  const pendingResolveRef = useRef<(() => void) | null>(null) // 连读中段的 promise resolver
  const aliveRef = useRef(true) // 组件是否仍挂载（避免卸载后 fetch 完成创建悬挂 objectURL）

  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])

  const stop = useCallback(() => {
    seqRef.current++
    if (pendingResolveRef.current) {
      const resolve = pendingResolveRef.current
      pendingResolveRef.current = null
      resolve() // 解除连读中段挂起的 promise，避免悬挂
    }
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
    const token = seqRef.current
    const obj = await resolve(url)
    if (!obj || !soundRef.current || token !== seqRef.current) return
    const audio = new Audio(obj)
    audioRef.current = audio
    try {
      await audio.play()
    } catch {
      // 自动播放被拦截等，忽略
    }
  }, [resolve, stop])

  // 连续播放（跟读 / 四声演示）：依次等每段结束，段间停顿 gapMs
  const playSequence = useCallback(async (urls: string[], gapMs = 420): Promise<void> => {
    if (!soundRef.current) return
    stop()
    const token = ++seqRef.current
    for (let idx = 0; idx < urls.length; idx++) {
      if (!soundRef.current || token !== seqRef.current) return
      const obj = await resolve(urls[idx])
      if (!obj) continue
      if (!soundRef.current || token !== seqRef.current) return
      await new Promise<void>(done => {
        const settle = () => {
          if (pendingResolveRef.current === settle) pendingResolveRef.current = null
          done()
        }
        pendingResolveRef.current = settle
        const audio = new Audio(obj)
        audioRef.current = audio
        audio.onended = settle
        audio.onerror = settle
        audio.play().catch(settle)
      })
      if (token !== seqRef.current) return
      if (idx < urls.length - 1) await delay(gapMs)
    }
  }, [resolve, stop])

  const playSyllab = useCallback((audioKey: string) => playUrl(syllabUrl(audioKey)), [playUrl])
  const playHanzi = useCallback((hanzi: string) => playUrl(hanziUrl(hanzi)), [playUrl])
  const playSyllabSequence = useCallback(
    (audioKeys: string[], gapMs?: number) => playSequence(audioKeys.map(syllabUrl), gapMs),
    [playSequence],
  )

  useEffect(() => {
    const cache = cacheRef.current
    return () => {
      aliveRef.current = false
      // 递增令牌使进行中的序列播放在卸载后失效（计数器，非 DOM 节点）
      // eslint-disable-next-line react-hooks/exhaustive-deps
      seqRef.current++
      if (pendingResolveRef.current) {
        const resolve = pendingResolveRef.current
        pendingResolveRef.current = null
        resolve()
      }
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

  return { playSyllab, playHanzi, playUrl, playSyllabSequence, playSequence, stop }
}
