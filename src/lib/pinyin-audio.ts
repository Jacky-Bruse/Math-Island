// 拼音音频路径解析。音频置于 public/audio/cmn/，部署 base 以 import.meta.env.BASE_URL 为准。
// audioKey 已在 toSyllable/数据层完成 ü→v 归一，此处不二次转换。

import { DAV_OVERRIDE_KEYS } from './pinyin-audio-overrides'

const BASE = `${import.meta.env.BASE_URL}audio/cmn`
const DAV_OVERRIDE = new Set(DAV_OVERRIDE_KEYS)

/** 音节音频 URL（audioKey 形如 'ma1'、'nv3'）。少数 stem 覆盖为 davinfifield 音源。 */
export function syllabUrl(audioKey: string): string {
  if (DAV_OVERRIDE.has(audioKey)) {
    // davinfifield 文件名无 cmn- 前缀，置于 dav/ 子目录
    return `${BASE}/dav/${audioKey}.mp3`
  }
  return `${BASE}/syllabs/cmn-${audioKey}.mp3`
}

/** 单字音频 URL（文件名即汉字，需 URL 编码）。 */
export function hanziUrl(hanzi: string): string {
  return `${BASE}/hsk/cmn-${encodeURIComponent(hanzi)}.mp3`
}
