import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import LetterCard from '../components/pinyin/LetterCard'
import ToneDemo from '../components/pinyin/ToneDemo'
import { useSettings } from '../hooks/useSettings'
import { usePinyinAudio } from '../hooks/usePinyinAudio'
import { usePinyinProgress } from '../hooks/usePinyinProgress'
import { LETTER_SEQUENCE, letterEntryId } from '../lib/pinyin-data'
import type { LetterEntry, LetterCategory } from '../types/pinyin'

const ACCENT: Record<LetterCategory, string> = {
  initial: 'text-pinyin',
  'single-final': 'text-rose-500',
  'compound-final': 'text-amber-600',
  'nasal-final': 'text-violet-500',
  'whole-syllable': 'text-sky-600',
}

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
  const { playSyllab, playSyllabSequence } = usePinyinAudio(settings.sound)
  const { progress, markLearned } = usePinyinProgress()

  const handleTap = (entry: LetterEntry) => {
    playSyllab(entryAudioKey(entry))
    markLearned(letterEntryId(entry))
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-text">认字母</h1>
        </div>

        <ToneDemo
          base="a"
          displays={['ā', 'á', 'ǎ', 'à']}
          onPlayTone={playSyllab}
          onPlayAll={playSyllabSequence}
        />

        <p className="text-xs text-text-secondary mb-3">
          点字母听发音；按统编版学习顺序排列（声母 · 单韵母 · 复韵母 · 鼻韵母 · 整体认读 分色）
        </p>

        <div className="grid grid-cols-5 gap-2">
          {LETTER_SEQUENCE.map(entry => {
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
      </div>
    </PageContainer>
  )
}
