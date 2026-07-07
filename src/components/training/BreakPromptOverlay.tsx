import type { BreakSource, TrainingModule } from '../../types/training'

interface Props {
  breakSource: BreakSource
  module: TrainingModule
  completedCount: number
  correctCount: number
  errorCount: number
  onRest: () => void
  onContinue: () => void
}

export default function BreakPromptOverlay({
  breakSource,
  module,
  completedCount,
  correctCount,
  errorCount,
  onRest,
  onContinue,
}: Props) {
  const isMidway = breakSource === 'midway'
  const isSudoku = module === 'sudoku'
  const completedLabel = isSudoku ? '完成盘数' : '做了题目'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-surface rounded-3xl shadow-xl p-8 mx-6 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{isMidway ? '⏰' : '🎉'}</div>
        <h2 className="text-xl font-bold mb-2">
          {isMidway ? '训练过半啦！' : '训练时间到！'}
        </h2>
        <p className="text-text-secondary mb-6">
          {isMidway ? '休息一下再继续吧' : '你做得很棒！休息一下吧'}
        </p>
        {!isMidway && (
          <div className={`grid gap-3 mb-6 ${isSudoku ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <div className="rounded-2xl bg-primary/10 py-3">
              <div className="text-xs text-text-secondary mb-1">{completedLabel}</div>
              <div className="text-2xl font-bold text-primary tabular-nums">{completedCount}</div>
            </div>
            {!isSudoku && (
              <div className="rounded-2xl bg-success/10 py-3">
                <div className="text-xs text-text-secondary mb-1">答对</div>
                <div className="text-2xl font-bold text-success tabular-nums">{correctCount}</div>
              </div>
            )}
            <div className="rounded-2xl bg-danger-light/20 py-3">
              <div className="text-xs text-text-secondary mb-1">出错次数</div>
              <div className="text-2xl font-bold text-danger tabular-nums">{errorCount}</div>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRest}
            className="w-full min-h-14 rounded-xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform"
          >
            休息 3 分钟
          </button>
          <button
            onClick={onContinue}
            className="w-full min-h-14 rounded-xl bg-surface-muted text-text font-semibold active:scale-95 transition-transform"
          >
            {isMidway ? '继续训练' : '继续'}
          </button>
        </div>
      </div>
    </div>
  )
}
