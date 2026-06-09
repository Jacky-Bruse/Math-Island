import { useEffect, useState } from 'react'
import { BLEND_INITIALS, BLEND_FINALS } from '../../lib/pinyin-data'
import { isValidBlend, toSyllable, availableTones } from '../../lib/pinyin-syllables'
import type { Tone, Initial, Final } from '../../types/pinyin'

interface Props {
  onPlay: (audioKey: string) => void
  onBlended: (audioKey: string) => void
}

const TONES: Tone[] = [1, 2, 3, 4]
const TONE_LABEL: Record<Tone, string> = { 1: '一声 ˉ', 2: '二声 ´', 3: '三声 ˇ', 4: '四声 `' }

export default function BlendBuilder({ onPlay, onBlended }: Props) {
  const [ini, setIni] = useState<Initial | null>(null)
  const [fin, setFin] = useState<Final | null>(null)
  const [tone, setTone] = useState<Tone>(1)

  const comboValid = ini && fin ? isValidBlend(ini.id, fin.id) : null
  const tones = ini && fin ? availableTones(ini.id, fin.id) : []
  const result = ini && fin && comboValid ? toSyllable(ini.id, fin.id, tone) : null

  // 组合变化后，若当前声调无录音则切到第一个可用声调（避免请求不存在的音频）
  useEffect(() => {
    if (tones.length && !tones.includes(tone)) setTone(tones[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tones.join(',')])

  // 拼出合法音节时自动播放并记录
  useEffect(() => {
    if (result) {
      onPlay(result.audioKey)
      onBlended(result.audioKey)
    }
    // 仅在音节 key 变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.audioKey])

  const chip = (active: boolean) =>
    `min-w-11 px-3 py-2 rounded-xl text-lg font-bold border active:scale-95 transition-transform ${
      active ? 'bg-pinyin text-white border-pinyin' : 'bg-surface text-text border-border'
    }`

  return (
    <div className="flex flex-col gap-4">
      {/* 拼出结果 */}
      <div className="rounded-2xl bg-pinyin-light border border-pinyin/20 p-5 min-h-28 flex flex-col items-center justify-center">
        {result ? (
          <>
            <div className="text-5xl font-extrabold text-pinyin">{result.display}</div>
            <button
              onClick={() => onPlay(result.audioKey)}
              className="mt-3 text-sm px-4 py-1.5 rounded-full bg-pinyin text-white active:scale-95 transition-transform"
            >
              ▶ 再听一次
            </button>
          </>
        ) : comboValid === false ? (
          <p className="text-text-secondary text-sm">这两个拼不成音哦，换一个试试 🙂</p>
        ) : (
          <p className="text-text-secondary text-sm">选一个声母 + 一个韵母 + 声调，拼拼看</p>
        )}
      </div>

      {/* 声母 */}
      <div>
        <div className="text-xs text-text-secondary mb-1.5">声母</div>
        <div className="flex flex-wrap gap-1.5">
          {BLEND_INITIALS.map(i => (
            <button key={i.id} onClick={() => setIni(i)} className={chip(ini?.id === i.id)}>
              {i.letter}
            </button>
          ))}
        </div>
      </div>

      {/* 韵母 */}
      <div>
        <div className="text-xs text-text-secondary mb-1.5">韵母</div>
        <div className="flex flex-wrap gap-1.5">
          {BLEND_FINALS.map(f => (
            <button key={f.id} onClick={() => setFin(f)} className={chip(fin?.id === f.id)}>
              {f.displayFinal}
            </button>
          ))}
        </div>
      </div>

      {/* 声调 */}
      <div>
        <div className="text-xs text-text-secondary mb-1.5">声调</div>
        <div className="grid grid-cols-4 gap-1.5">
          {TONES.map(t => {
            // 组合已选但该声调无录音 → 禁用
            const unavailable = !!(ini && fin && comboValid && !tones.includes(t))
            return (
              <button
                key={t}
                onClick={() => setTone(t)}
                disabled={unavailable}
                className={`${chip(tone === t)} ${unavailable ? 'opacity-30' : ''}`}
              >
                {TONE_LABEL[t]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
