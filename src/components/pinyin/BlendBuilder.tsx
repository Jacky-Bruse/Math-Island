import { useEffect, useState } from 'react'
import { ALL_BLEND_FINALS, BLEND_INITIALS, BLEND_FINALS, TRIPLE_FINALS } from '../../lib/pinyin-data'
import { blendBaseFor, isValidBlend, isWholeSyllableBase, spellingAudioKeys, toSyllable } from '../../lib/pinyin-syllables'
import type { Tone, Initial, Final } from '../../types/pinyin'

interface Props {
  onSpell: (audioKeys: string[]) => void
  onBlended: (audioKey: string) => void
  onPreload: (audioKeys: string[]) => void
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

function nextBlendAudioKeys(ini: Initial, fin: Final, tone: Tone | null): string[] {
  const keys = new Set<string>()
  const add = (initialId: string, finalId: string, nextTone: Tone) => {
    for (const key of spellingAudioKeys(initialId, finalId, nextTone)) keys.add(key)
  }

  for (const nextTone of TONES) {
    add(ini.id, fin.id, nextTone)
  }
  if (tone) {
    for (const nextInitial of BLEND_INITIALS) {
      add(nextInitial.id, fin.id, tone)
    }
    for (const nextFinal of ALL_BLEND_FINALS) {
      add(ini.id, nextFinal.id, tone)
    }
  }

  return [...keys]
}

export default function BlendBuilder({ onSpell, onBlended, onPreload }: Props) {
  const [ini, setIni] = useState<Initial | null>(BLEND_INITIALS[0] ?? null)
  const [fin, setFin] = useState<Final | null>(BLEND_FINALS[0] ?? null)
  const [tone, setTone] = useState<Tone | null>(null)

  const invalidPair = !!ini && !!fin && !isValidBlend(ini.id, fin.id)
  const pairBase = ini && fin && !invalidPair ? blendBaseFor(ini.id, fin.id) : null
  const result = ini && fin && tone ? toSyllable(ini.id, fin.id, tone) : null
  const spellingKeys = ini && fin && tone ? spellingAudioKeys(ini.id, fin.id, tone) : []
  const isWholeSyllable = pairBase ? isWholeSyllableBase(pairBase) : false

  useEffect(() => {
    if (!ini || !fin) return
    const timer = window.setTimeout(() => {
      onPreload(nextBlendAudioKeys(ini, fin, tone))
    }, 150)
    return () => window.clearTimeout(timer)
  }, [fin, ini, onPreload, tone])

  const selectInitial = (next: Initial) => {
    if (ini?.id === next.id) return
    onSpell([])
    setIni(next)
    setTone(null)
  }

  const selectFinal = (next: Final) => {
    if (fin?.id === next.id) return
    onSpell([])
    setFin(next)
    setTone(null)
  }

  const selectTone = (next: Tone) => {
    if (!ini || !fin || invalidPair || tone === next) return
    const nextResult = toSyllable(ini.id, fin.id, next)
    if (!nextResult) return
    setTone(next)
    onSpell(spellingAudioKeys(ini.id, fin.id, next))
    onBlended(nextResult.audioKey)
  }

  const emptyLabel = ini ? '请选择韵母' : fin ? '请选择声母' : '请选择声母和韵母'

  return (
    <div className="space-y-5">
      <section
        aria-label="拼读结果"
        aria-live="polite"
        className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-pinyin/30 bg-pinyin-light px-4 py-5 text-center shadow-sm"
      >
        <div className={`${result || pairBase ? 'text-5xl text-pinyin' : `text-xl ${invalidPair ? 'text-danger' : 'text-pinyin'}`} font-extrabold`}>
          {result?.display ?? (invalidPair ? '不能拼读，换一个试试' : pairBase ?? emptyLabel)}
        </div>
        {pairBase && !tone && <div className="mt-2 text-sm font-bold text-text-secondary">请选择声调</div>}
        {isWholeSyllable && <div className="mt-2 text-sm font-bold text-text-secondary">整体认读音节</div>}
        {result && (
          <button
            type="button"
            onClick={() => onSpell(spellingKeys)}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-pinyin px-5 text-sm font-bold text-white shadow-sm transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pinyin active:scale-95"
          >
            ▶ {isWholeSyllable ? '再读一次' : '再拼一次'}
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
        <div aria-label="三拼组合" className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {TRIPLE_FINALS.map(item => (
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
              onClick={() => selectTone(itemTone)}
              disabled={invalidPair}
              aria-pressed={tone === itemTone}
              className={`${optionClass(tone === itemTone)} px-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:text-base`}
            >
              {TONE_LABEL[itemTone]}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
