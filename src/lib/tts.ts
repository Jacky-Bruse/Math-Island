import type { Settings } from '../types/settings'
import type { Poem, PoemSegment } from '../types/poem'

type TtsBaseUrlConfig = Pick<Settings, 'poemTtsUseCustomService' | 'poemTtsServiceUrl'>
type PoemSegmentSettings = Pick<Settings, 'poemReadTitle' | 'poemReadMeta'>

/**
 * 获取 TTS 服务的基地址。
 * 默认内置模式使用同源 /api，自定义模式使用用户设置的地址。
 */
export function getTtsBaseUrl(settings: TtsBaseUrlConfig): string {
  if (settings.poemTtsUseCustomService && settings.poemTtsServiceUrl) {
    return settings.poemTtsServiceUrl.replace(/\/+$/, '')
  }
  return '/api'
}

/**
 * 检查 TTS 服务健康状态。
 */
export async function checkTtsHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return false
    const data = await res.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}

/**
 * 获取可用语音列表。
 */
export async function fetchVoices(baseUrl: string): Promise<{ name: string; displayName: string }[]> {
  const res = await fetch(`${baseUrl}/voices`)
  if (!res.ok) throw new Error('Failed to fetch voices')
  const data = await res.json()
  return data.voices
}

/**
 * 请求 TTS 合成，返回音频 Blob。
 */
export async function synthesizeSpeech(
  baseUrl: string,
  text: string,
  voice: string,
  rate: number,
  pitch: number,
): Promise<Blob> {
  const res = await fetch(`${baseUrl}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, rate, pitch }),
  })
  if (!res.ok) throw new Error('TTS synthesis failed')
  return res.blob()
}

/**
 * 将古诗转换为朗读段落队列。
 */
export function buildSegments(poem: Poem, settings: PoemSegmentSettings): PoemSegment[] {
  const segments: PoemSegment[] = []

  if (settings.poemReadTitle) {
    segments.push({ type: 'title', text: poem.title })
  }

  if (settings.poemReadMeta) {
    const metaParts: string[] = []
    if (poem.dynasty) metaParts.push(poem.dynasty)
    if (poem.author) metaParts.push(poem.author)
    if (metaParts.length > 0) {
      segments.push({ type: 'meta', text: metaParts.join(' · ') })
    }
  }

  const lines = poem.content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  for (const line of lines) {
    segments.push({ type: 'line', text: line })
  }

  return segments
}
