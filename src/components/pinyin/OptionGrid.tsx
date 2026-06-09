import type { ExampleWord } from '../../types/pinyin'
import type { PracticeStatus } from '../../hooks/usePinyinPractice'

interface Props {
  options: ExampleWord[]
  targetHanzi: string
  status: PracticeStatus
  wrongPicks: string[]
  onPick: (hanzi: string) => void
}

export default function OptionGrid({ options, targetHanzi, status, wrongPicks, onPick }: Props) {
  const answering = status === 'answering'

  function cls(w: ExampleWord): string {
    const base = 'aspect-square rounded-2xl border shadow-sm flex items-center justify-center text-4xl font-extrabold transition-transform active:scale-95'
    const reveal = status === 'correct' || status === 'revealed'
    if (reveal && w.hanzi === targetHanzi) {
      return `${base} bg-success/15 border-success text-success`
    }
    if (wrongPicks.includes(w.hanzi)) {
      return `${base} bg-danger/10 border-danger text-danger`
    }
    return `${base} bg-surface border-border text-text`
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map(w => (
        <button
          key={w.hanzi}
          onClick={() => answering && onPick(w.hanzi)}
          disabled={!answering}
          className={cls(w)}
        >
          {w.hanzi}
        </button>
      ))}
    </div>
  )
}
