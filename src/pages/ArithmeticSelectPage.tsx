import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import { saveLastArithRange } from '../lib/storage'

const ranges = [
  { value: 10, label: '10以内', desc: '基础入门' },
  { value: 20, label: '20以内', desc: '进阶练习' },
  { value: 100, label: '100以内', desc: '挑战提升' },
] as const

export default function ArithmeticSelectPage() {
  const navigate = useNavigate()

  const handleSelect = (range: number) => {
    saveLastArithRange(range)
    navigate(`/arithmetic/${range}`)
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">加减法</h1>
        </div>

        <div className="flex flex-col gap-4">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => handleSelect(r.value)}
              className="w-full min-h-20 rounded-2xl bg-arithmetic-light border border-arithmetic/20 shadow-sm px-6 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <div className="text-xl font-bold text-text">{r.label}</div>
                <div className="text-sm text-text-secondary">{r.desc}</div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
