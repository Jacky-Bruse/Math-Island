// 拼音正字法核心（纯逻辑，无 DOM 依赖；app 与音频生成脚本共用）
// 负责：声母 + canonical 韵母 → 正写音节；介韵缩写；ü 拼写；声调符号位置；ü→v 音频 key。

import type { Tone } from '../types/pinyin'

// 带调符号表（下标 0..3 对应一..四声）
const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

const VOWELS = ['a', 'o', 'e', 'i', 'u', 'ü']

/**
 * 声母 + canonical 韵母 → 正写音节（无调，ü 保留为 ü）。
 * 处理介韵缩写（iou→iu / uei→ui / uen→un）与 j/q/x + ü 去两点。
 * initial 为空串表示零声母（BlendBuilder 不走此路径，仅作完整性兜底）。
 */
export function blendBase(initial: string, canonicalFinal: string): string {
  let f = canonicalFinal

  if (initial) {
    // 有声母时的介韵缩写
    if (f === 'iou') f = 'iu'
    else if (f === 'uei') f = 'ui'
    else if (f === 'uen') f = 'un'

    // j/q/x + ü 去两点写作 u
    if (initial === 'j' || initial === 'q' || initial === 'x') {
      if (f === 'ü') f = 'u'
      else if (f === 'üe') f = 'ue'
      else if (f === 'üan') f = 'uan'
      else if (f === 'ün') f = 'un'
    }
    // n/l + ü 保留 ü（nü / lü / nüe / lüe）
    return initial + f
  }

  return f
}

/** 在无调正写音节上加声调符号，返回带调显示形（ü 保留）。 */
export function applyToneMark(base: string, tone: Tone): string {
  let idx = -1
  if (base.includes('a')) {
    idx = base.indexOf('a')
  } else if (base.includes('e')) {
    idx = base.indexOf('e')
  } else if (base.includes('ou')) {
    idx = base.indexOf('o')
  } else {
    // 取最后一个元音（覆盖 iu→标 u、ui→标 i 的规则）
    for (let i = base.length - 1; i >= 0; i--) {
      if (VOWELS.includes(base[i])) {
        idx = i
        break
      }
    }
  }
  if (idx < 0) return base
  const ch = base[idx]
  const marks = TONE_MARKS[ch]
  if (!marks) return base
  return base.slice(0, idx) + marks[tone - 1] + base.slice(idx + 1)
}

/** 无调正写音节 + 声调 → 音频文件 stem（ü→v 归一）。如 ('nü',3)→'nv3'、('ma',1)→'ma1'。 */
export function toAudioKey(base: string, tone: Tone): string {
  return base.replace(/ü/g, 'v') + String(tone)
}
