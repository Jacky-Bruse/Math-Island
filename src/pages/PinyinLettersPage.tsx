import { useEffect } from 'react'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import LetterCard from '../components/pinyin/LetterCard'
import { useSettings } from '../hooks/useSettings'
import { usePinyinAudio } from '../hooks/usePinyinAudio'
import { usePinyinProgress } from '../hooks/usePinyinProgress'
import { FINALS, INITIALS, WHOLE_SYLLABLES, letterEntryId } from '../lib/pinyin-data'
import { FINAL_GROUPS } from '../lib/pinyin-groups'
import type { LetterEntry, LetterCategory } from '../types/pinyin'

const ACCENT: Record<LetterCategory, string> = {
  initial: 'text-pinyin',
  'single-final': 'text-rose-500',
  'compound-final': 'text-amber-600',
  'special-final': 'text-orange-600',
  'front-nasal-final': 'text-violet-500',
  'back-nasal-final': 'text-indigo-500',
  'whole-syllable': 'text-sky-600',
}

const INITIAL_ENTRIES: LetterEntry[] = INITIALS.map(data => ({ kind: 'initial', data }))
const WHOLE_ENTRIES: LetterEntry[] = WHOLE_SYLLABLES.map(data => ({ kind: 'whole', data }))
const LETTER_AUDIO_KEYS = [...new Set([
  ...INITIALS.map(item => item.audioSyllable),
  ...FINALS.map(item => item.audioRepresentative),
  ...WHOLE_SYLLABLES.map(item => item.audioKey),
])]

function entryCategory(entry: LetterEntry): LetterCategory {
  if (entry.kind === 'initial') return 'initial'
  if (entry.kind === 'whole') return 'whole-syllable'
  return entry.data.category
}

function entryLabel(entry: LetterEntry): string {
  if (entry.kind === 'initial') return entry.data.letter
  if (entry.kind === 'whole') return entry.data.syllable
  return entry.data.displayFinal
}

function entryAudioKey(entry: LetterEntry): string {
  if (entry.kind === 'initial') return entry.data.audioSyllable
  if (entry.kind === 'whole') return entry.data.audioKey
  return entry.data.audioRepresentative
}

export default function PinyinLettersPage() {
  const { settings } = useSettings()
  const { playLetter, preloadLetter } = usePinyinAudio(settings.sound)
  const { progress, markLearned } = usePinyinProgress()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void preloadLetter(LETTER_AUDIO_KEYS)
    }, 150)
    return () => window.clearTimeout(timer)
  }, [preloadLetter])

  const handleTap = (entry: LetterEntry) => {
    playLetter(entryAudioKey(entry))
    markLearned(letterEntryId(entry))
  }

  const renderGrid = (entries: readonly LetterEntry[]) => (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {entries.map(entry => {
        const id = letterEntryId(entry)
        const isOng = entry.kind === 'final' && entry.data.highlightFinal
        return (
          <LetterCard
            key={id}
            label={entryLabel(entry)}
            accentClass={ACCENT[entryCategory(entry)]}
            learned={!!progress.learned[id]}
            onClick={() => handleTap(entry)}
            title={isOng ? '听“hong”里的 ong（例音节）' : undefined}
          />
        )
      })}
    </div>
  )

  return (
    <PageContainer>
      <div className="w-full max-w-2xl pb-8">
        <div className="mb-2 flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-text">认字母</h1>
        </div>

        <p className="mb-7 ml-12 text-sm text-text-secondary">
          点一下，听发音。按类别认清它们，再试着跟读。
        </p>

        <div className="space-y-9">
          <section aria-labelledby="initials-title">
            <div className="mb-3 flex items-end justify-between border-b border-border pb-2">
              <div>
                <h2 id="initials-title" className="text-xl font-extrabold text-text">声母</h2>
                <p className="mt-0.5 text-xs text-text-secondary">读得轻而短，站在音节前面</p>
              </div>
              <span className="text-xs font-bold text-pinyin">23 个</span>
            </div>
            {renderGrid(INITIAL_ENTRIES)}
          </section>

          <section aria-labelledby="finals-title">
            <div className="mb-5 flex items-end justify-between border-b border-border pb-2">
              <div>
                <h2 id="finals-title" className="text-xl font-extrabold text-text">韵母</h2>
                <p className="mt-0.5 text-xs text-text-secondary">读得响而长，按发音特点分成五类</p>
              </div>
              <span className="text-xs font-bold text-pinyin">24 个</span>
            </div>

            <div className="space-y-6">
              {FINAL_GROUPS.map(group => {
                const entries: LetterEntry[] = FINALS
                  .filter(item => item.category === group.category)
                  .map(data => ({ kind: 'final', data }))
                return (
                  <div key={group.category} className={`border-l-4 pl-3 ${group.railClass}`}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="font-bold text-text">{group.title}</h3>
                      <p className="text-xs text-text-secondary">{group.cue}</p>
                    </div>
                    {renderGrid(entries)}
                  </div>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="whole-title">
            <div className="mb-3 flex items-end justify-between border-b border-border pb-2">
              <div>
                <h2 id="whole-title" className="text-xl font-extrabold text-text">整体认读音节</h2>
                <p className="mt-0.5 text-xs text-text-secondary">不拆分拼读，看到后作为完整音节直接读</p>
              </div>
              <span className="text-xs font-bold text-sky-600">16 个</span>
            </div>
            {renderGrid(WHOLE_ENTRIES)}
          </section>
        </div>
      </div>
    </PageContainer>
  )
}
