// 拼读合法性：唯一数据源为本课程目标音节表（pinyin-syllables.generated.ts，依音频存在性逐声调生成）。
// 校验“声母+韵母”是否合法、产出正写结果、并给出实际有录音的声调，供 BlendBuilder 使用。

import { blendBase, applyToneMark, toAudioKey } from './pinyin-orthography'
import { getInitialById, getFinalById } from './pinyin-data'
import { VALID_BLEND_SYLLABLES } from './pinyin-syllables.generated'
import type { SyllableResult, Tone } from '../types/pinyin'

// 剔除不适合一年级拼读的 base：
// - audio-cmn 收录的方言/语气/罕见音节（fe/lo/cei/tei/kei/nun…），普通话拼读教学不出现。
// 注：整体认读音节（zhi/chi/shi/ri/zi/ci/si）虽按统编版整体认读，但四声均需练习，
//     故保留在拼读器中可作普通音节拼读（四声音频齐全）。
const DENYLIST = new Set<string>([
  'fe', 'lo', 'cei', 'tei', 'kei', 'nun', 'nou',
])

const toneMap = new Map<string, Tone[]>(
  Object.entries(VALID_BLEND_SYLLABLES)
    .filter(([base]) => !DENYLIST.has(base))
    .map(([base, tones]) => [base, tones as Tone[]]),
)

/** 由声母/韵母 id 计算无调正写 base（ü 保留）；非法或 y/w 返回 null。 */
export function blendBaseFor(initialId: string, finalId: string): string | null {
  const ini = getInitialById(initialId)
  const fin = getFinalById(finalId)
  if (!ini || !fin || !ini.canBlend) return null
  return blendBase(ini.id, fin.canonicalFinal)
}

/** “声母+韵母”是否为本课程目标音节表中的合法音节（至少一个声调有录音）。 */
export function isValidBlend(initialId: string, finalId: string): boolean {
  const base = blendBaseFor(initialId, finalId)
  return base != null && toneMap.has(base)
}

/** 该“声母+韵母”实际有录音的声调列表（无则空数组）。 */
export function availableTones(initialId: string, finalId: string): Tone[] {
  const base = blendBaseFor(initialId, finalId)
  return base ? toneMap.get(base) ?? [] : []
}

/** 合法且该声调有录音则返回结构化结果，否则 null（避免请求不存在的音频）。 */
export function toSyllable(initialId: string, finalId: string, tone: Tone): SyllableResult | null {
  const base = blendBaseFor(initialId, finalId)
  if (!base) return null
  const tones = toneMap.get(base)
  if (!tones || !tones.includes(tone)) return null
  return {
    display: applyToneMark(base, tone),
    audioKey: toAudioKey(base, tone),
    base,
    tone,
  }
}

export function isValidBase(base: string): boolean {
  return toneMap.has(base)
}
