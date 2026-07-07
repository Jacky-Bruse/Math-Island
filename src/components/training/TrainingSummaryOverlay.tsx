import type { TrainingModule } from '../../types/training'

interface Props {
  open: boolean
  module: TrainingModule
  completedCount: number
  correctCount: number
  errorCount: number
  onGoHome: () => void
}

export default function TrainingSummaryOverlay({
  open,
  module,
  completedCount,
  correctCount,
  errorCount,
  onGoHome,
}: Props) {
  if (!open) return null

  const isSudoku = module === 'sudoku'
  const completedLabel = isSudoku ? '完成盘数' : '做了题目'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-surface rounded-3xl shadow-xl p-7 mx-6 max-w-sm w-full text-center">
        <div className="text-5xl mb-3">📘</div>
        <h2 className="text-2xl font-bold mb-5">本轮小结</h2>
        <div className={`grid gap-3 mb-6 ${isSudoku ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <div className="rounded-2xl bg-primary/10 py-4">
            <div className="text-xs text-text-secondary mb-1">{completedLabel}</div>
            <div className="text-3xl font-extrabold text-primary tabular-nums">{completedCount}</div>
          </div>
          {!isSudoku && (
            <div className="rounded-2xl bg-success/10 py-4">
              <div className="text-xs text-text-secondary mb-1">答对</div>
              <div className="text-3xl font-extrabold text-success tabular-nums">{correctCount}</div>
            </div>
          )}
          <div className="rounded-2xl bg-danger-light/20 py-4">
            <div className="text-xs text-text-secondary mb-1">出错次数</div>
            <div className="text-3xl font-extrabold text-danger tabular-nums">{errorCount}</div>
          </div>
        </div>
        <button
          onClick={onGoHome}
          className="w-full min-h-14 rounded-xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform"
        >
          返回首页
        </button>
      </div>
    </div>
  )
}
