import { useNavigate } from 'react-router-dom'
import BackButton from '../components/shared/BackButton'
import PageContainer from '../components/layout/PageContainer'
import type { PracticeLevel } from '../types/multiplication'

const levels: PracticeLevel[] = [2, 3, 4, 5, 6, 7, 8, 9]

const labels: Record<PracticeLevel, string> = {
  2: '练到二',
  3: '练到三',
  4: '练到四',
  5: '练到五',
  6: '练到六',
  7: '练到七',
  8: '练到八',
  9: '练到九',
}

export default function MultiplicationPracticeSelectPage() {
  const navigate = useNavigate()

  return (
    <PageContainer className="bg-[var(--mult-page)]">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-black text-mult-ink">口诀练习</h1>
            <p className="text-sm text-text-secondary">按累计范围练，选到几就练到几</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {levels.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => navigate(`/arithmetic/multiplication/practice/${level}`)}
              className="rounded-[1.75rem] border border-mult-border-soft bg-[var(--mult-level)] px-6 py-5 text-left shadow-[var(--mult-shadow-sm)] active:scale-[0.98] transition-transform"
            >
              <div className="text-xs font-bold uppercase tracking-[0.26em] text-mult-accent-soft">Practice Level</div>
              <div className="mt-2 text-2xl font-black text-mult-ink-strong">{labels[level]}</div>
              <div className="mt-2 text-sm text-text-secondary">一到{level}的口诀</div>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
