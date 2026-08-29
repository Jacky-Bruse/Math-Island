import { useEffect, useRef, useState } from 'react'
import { BLEND_INITIALS, BLEND_FINALS } from '../../lib/pinyin-data'
import { isValidBlend, toSyllable } from '../../lib/pinyin-syllables'
import type { Tone, Initial, Final } from '../../types/pinyin'

interface Props {
  onPlay: (audioKey: string) => void
  onBlended: (audioKey: string) => void
}

const TONES: Tone[] = [1, 2, 3, 4]
const TONE_LABEL: Record<Tone, string> = {
  1: '一声 ˉ',
  2: '二声 ˊ',
  3: '三声 ˇ',
  4: '四声 ˋ',
}

function optionClass(active: boolean): string {
  const state = active
    ? 'border-pinyin bg-pinyin text-white shadow-sm'
    : 'border-border-strong bg-surface text-text hover:border-pinyin/60 hover:bg-pinyin-light'
  return `inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-extrabold transition-[transform,border-color,background-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pinyin active:scale-95 ${state}`
}

export default function BlendBuilder({ onPlay, onBlended }: Props) {
  const [ini, setIni] = useState<Initial | null>(BLEND_INITIALS[0] ?? null)
  const [fin, setFin] = useState<Final | null>(BLEND_FINALS[0] ?? null)
  const [tone, setTone] = useState<Tone>(1)
  const mountedRef = useRef(false)

  const result = ini && fin ? toSyllable(ini.id, fin.id, tone) : null

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (result) {
      onPlay(result.audioKey)
      onBlended(result.audioKey)
    }
    // 只在用户改变带调音节后播放和记录；默认展示的 bā 不自动播放。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.audioKey])

  const selectInitial = (next: Initial) => {
    setIni(next)
  }

  const selectFinal = (next: Final) => {
    setFin(next)
  }

  const emptyLabel = ini ? '请选择韵母' : fin ? '请选择声母' : '请选择声母和韵母'
  const invalidPair = !!ini && !!fin && !isValidBlend(ini.id, fin.id)

  return (
    <div className="space-y-5">
      <section
        aria-label="拼读结果"
        aria-live="polite"
        className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-pinyin/30 bg-pinyin-light px-4 py-5 text-center shadow-sm"
      >
        <div className={`${result ? 'text-5xl text-pinyin' : `text-xl ${invalidPair ? 'text-danger' : 'text-pinyin'}`} font-extrabold`}>
          {result?.display ?? (invalidPair ? '不能拼读，换一个试试' : emptyLabel)}
        </div>
        {result && (
          <button
            type="button"
            onClick={() => onPlay(result.audioKey)}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-pinyin px-5 text-sm font-bold text-white shadow-sm transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pinyin active:scale-95"
          >
            ▶ 再听一次
          </button>
        )}
      </section>

      <section aria-labelledby="blend-initial-title">
        <h2 id="blend-initial-title" className="mb-2 text-sm font-bold text-text-secondary">声母</h2>
        <div className="flex flex-wrap gap-2">
          {BLEND_INITIALS.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectInitial(item)}
              aria-pressed={ini?.id === item.id}
              className={`${optionClass(ini?.id === item.id)} text-base`}
            >
              {item.letter}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="blend-final-title">
        <h2 id="blend-final-title" className="mb-2 text-sm font-bold text-text-secondary">韵母</h2>
        <div className="flex flex-wrap gap-2">
          {BLEND_FINALS.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => selectFinal(item)}
              aria-pressed={fin?.id === item.id}
              className={`${optionClass(fin?.id === item.id)} text-base`}
            >
              {item.displayFinal}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="blend-tone-title">
        <h2 id="blend-tone-title" className="mb-2 text-sm font-bold text-text-secondary">声调</h2>
        <div className="grid grid-cols-4 gap-2">
          {TONES.map(itemTone => (
            <button
              type="button"
              key={itemTone}
              onClick={() => setTone(itemTone)}
              aria-pressed={tone === itemTone}
              className={`${optionClass(tone === itemTone)} px-2 text-sm sm:text-base`}
            >
              {TONE_LABEL[itemTone]}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
