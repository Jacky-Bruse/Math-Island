// 拼音音频路径解析。音频置于 public/audio/cmn/，部署 base 以 import.meta.env.BASE_URL 为准。
// audioKey 已在 toSyllable/数据层完成 ü→v 归一，此处不二次转换。

const BASE = `${import.meta.env.BASE_URL}audio/cmn`

/** 音节音频 URL（audioKey 形如 'ma1'、'nv3'）。 */
export function syllabUrl(audioKey: string): string {
  return `${BASE}/syllabs/cmn-${audioKey}.mp3`
}

/** 单字音频 URL（文件名即汉字，需 URL 编码）。 */
export function hanziUrl(hanzi: string): string {
  return `${BASE}/hsk/cmn-${encodeURIComponent(hanzi)}.mp3`
}
