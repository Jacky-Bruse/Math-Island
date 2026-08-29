// 拼音音频路径解析。音频置于 public/audio/cmn/，部署 base 以 import.meta.env.BASE_URL 为准。
// audioKey 已在 toSyllable/数据层完成 ü→v 归一，此处不二次转换。

import { DAV_OVERRIDE_KEYS, YABLA_LETTER_FALLBACK_KEYS } from './pinyin-audio-overrides'

const BASE = `${import.meta.env.BASE_URL}audio/cmn`
const DAV_OVERRIDE = new Set(DAV_OVERRIDE_KEYS)
const YABLA_LETTER_FALLBACK = new Set(YABLA_LETTER_FALLBACK_KEYS)

/** 音节音频 URL（audioKey 形如 'ma1'、'nv3'）。少数 stem 覆盖为 davinfifield 音源。 */
export function syllabUrl(audioKey: string): string {
  if (DAV_OVERRIDE.has(audioKey)) {
    // davinfifield 文件名无 cmn- 前缀，置于 dav/ 子目录
    return `${BASE}/dav/${audioKey}.mp3`
  }
  return `${BASE}/syllabs/cmn-${audioKey}.mp3`
}

/** 认字母页音频 URL；Yabla 缺失项回退到原音节录音。 */
export function letterUrl(audioKey: string): string {
  if (YABLA_LETTER_FALLBACK.has(audioKey)) return syllabUrl(audioKey)
  return `${BASE}/yabla/${audioKey}.mp3`
}

/** 拼读页统一使用已导入的 Yabla 四声音频。 */
export function blendUrl(audioKey: string): string {
  return `${BASE}/yabla/${audioKey}.mp3`
}

/** 单字音频 URL（文件名即汉字，需 URL 编码）。 */
export function hanziUrl(hanzi: string): string {
  return `${BASE}/hsk/cmn-${encodeURIComponent(hanzi)}.mp3`
}
