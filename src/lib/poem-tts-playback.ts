import type { PoemSegment } from '../types/poem'
import type { PoemTtsMode } from '../types/settings'

export const DEFAULT_FOLLOW_PAUSE_SECONDS = 1.8

function countReadableChars(text: string): number {
  return text.replace(/[，。！？、；：,.!?\s]/g, '').length
}

export function getInterSegmentPauseMs(
  mode: PoemTtsMode,
  followPauseSeconds: number,
  segment: PoemSegment,
): number {
  if (mode === 'normal') {
    return segment.type === 'line' ? 280 : 220
  }

  const baseMs = Math.round(followPauseSeconds * 1000)
  if (segment.type !== 'line') {
    return Math.max(1000, Math.round(baseMs * 0.8))
  }

  const adaptiveBonus = Math.min(1050, countReadableChars(segment.text) * 70)
  return baseMs + adaptiveBonus
}
