// 拼读合法性：课程音节范围与具体音频源分离。
// generated 表的 base 键作为已确认的课程范围；四声音频完整性由测试在发布前校验。

import { blendBase, applyToneMark, toAudioKey } from './pinyin-orthography'
import { getInitialById, getFinalById, getTripleFinalById, TRIPLE_FINALS, WHOLE_SYLLABLES } from './pinyin-data'
import { VALID_BLEND_SYLLABLES } from './pinyin-syllables.generated'
import type { SyllableResult, Tone } from '../types/pinyin'

// 剔除不适合一年级拼读的 base：
// - audio-cmn 收录的方言/语气/罕见音节（fe/lo/cei/tei/kei/nun…），普通话拼读教学不出现。
// 注：整体认读音节（zhi/chi/shi/ri/zi/ci/si）保留在拼读器中练习四声，但直接整体朗读。
const DENYLIST = new Set<string>([
  'fe', 'lo', 'cei', 'tei', 'kei', 'nun', 'nou',
])

const TONES: Tone[] = [1, 2, 3, 4]
const validBases = new Set(
  Object.keys(VALID_BLEND_SYLLABLES).filter(base => !DENYLIST.has(base)),
)
const wholeSyllableBases = new Set(WHOLE_SYLLABLES.map(item => item.syllable))
const tripleSyllableBases = new Set(
  TRIPLE_FINALS.flatMap(fin => fin.validInitialIds.map(initialId => blendBase(initialId, fin.canonicalFinal))),
)

// j/q/x 后写作 u、un 的音实际属于 ü、ün；只允许孩子从 ü、ün 入口选择。
function isDuplicateJqxPath(initialId: string, finalId: string): boolean {
  return ['j', 'q', 'x'].includes(initialId) && ['u', 'uen'].includes(finalId)
}

/** 由声母/韵母 id 计算无调正写 base（ü 保留）；非法或 y/w 返回 null。 */
export function blendBaseFor(initialId: string, finalId: string): string | null {
  const ini = getInitialById(initialId)
  const fin = getFinalById(finalId)
  if (!ini || !fin || !ini.canBlend) return null
  return blendBase(ini.id, fin.canonicalFinal)
}

/** “声母+韵母”是否属于本课程目标音节范围。 */
export function isValidBlend(initialId: string, finalId: string): boolean {
  const tripleFinal = getTripleFinalById(finalId)
  if (tripleFinal) return tripleFinal.validInitialIds.includes(initialId)
  if (isDuplicateJqxPath(initialId, finalId)) return false
  const base = blendBaseFor(initialId, finalId)
  return base != null && validBases.has(base)
}

/** 该“声母+韵母”的课程声调列表（无效组合返回空数组）。 */
export function availableTones(initialId: string, finalId: string): Tone[] {
  return isValidBlend(initialId, finalId) ? [...TONES] : []
}

/** 合法组合返回结构化结果，否则 null。 */
export function toSyllable(initialId: string, finalId: string, tone: Tone): SyllableResult | null {
  if (!isValidBlend(initialId, finalId)) return null
  const base = blendBaseFor(initialId, finalId)
  if (!base) return null
  return {
    display: applyToneMark(base, tone),
    audioKey: toAudioKey(base, tone),
    base,
    tone,
  }
}

/** 韵母在指定声调下的代表音频键，如 a→a2、ui→wei3、ong→ong4。 */
export function finalToneAudioKey(finalId: string, tone: Tone): string | null {
  const fin = getFinalById(finalId)
  if (!fin) return null
  return `${fin.audioRepresentative.replace(/\d$/, '')}${tone}`
}

export function isWholeSyllableBase(base: string): boolean {
  return wholeSyllableBases.has(base)
}

/** 普通音节返回三段音频键；整体认读音节只返回完整读音；非法组合返回空数组。 */
export function spellingAudioKeys(initialId: string, finalId: string, tone: Tone): string[] {
  const ini = getInitialById(initialId)
  const finalKey = finalToneAudioKey(finalId, tone)
  const syllable = toSyllable(initialId, finalId, tone)
  if (!ini || !finalKey || !syllable) return []
  if (isWholeSyllableBase(syllable.base)) return [syllable.audioKey]
  const tripleFinal = getTripleFinalById(finalId)
  if (tripleFinal) {
    const medialId = finalId === 'uan' && ['j', 'q', 'x'].includes(initialId) ? 'v' : tripleFinal.medialId
    const medialKey = getFinalById(medialId)?.audioRepresentative
    return medialKey ? [ini.audioSyllable, medialKey, finalKey, syllable.audioKey] : []
  }
  return [ini.audioSyllable, finalKey, syllable.audioKey]
}

export function isValidBase(base: string): boolean {
  return validBases.has(base) || tripleSyllableBases.has(base)
}
