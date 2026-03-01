import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import { saveLastSudokuSize } from '../lib/storage'
import { hasDraft } from '../lib/db'

const sizes = [
  { value: 4, label: '4×4', desc: '入门级' },
  { value: 6, label: '6×6', desc: '进阶级' },
  { value: 8, label: '8×8', desc: '挑战级' },
] as const

export default function SudokuSelectPage() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Record<number, boolean>>({})

  useEffect(() => {
    async function checkDrafts() {
      const results: Record<number, boolean> = {}
      for (const s of sizes) {
        results[s.value] = await hasDraft(s.value)
      }
      setDrafts(results)
    }
    checkDrafts()
  }, [])

  const handleSelect = (size: number) => {
    saveLastSudokuSize(size)
    navigate(`/sudoku/${size}`)
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">数独</h1>
        </div>

        <div className="flex flex-col gap-4">
          {sizes.map(s => (
            <button
              key={s.value}
              onClick={() => handleSelect(s.value)}
              className="w-full min-h-20 rounded-2xl bg-sudoku-light border border-sudoku/20 shadow-sm px-6 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="text-left">
                <div className="text-xl font-bold text-text">
                  {s.label}
                  {drafts[s.value] && (
                    <span className="ml-2 text-xs font-normal text-secondary bg-secondary-light/50 px-2 py-0.5 rounded-full">
                      有草稿
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary">{s.desc}</div>
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
