import TrainingShell from '../components/training/TrainingShell'
import type { TrainingShellContext } from '../components/training/TrainingShell'
import MascotBubble from '../components/shared/MascotBubble'
import StarReward from '../components/shared/StarReward'
import { useComparison } from '../hooks/useComparison'

function ComparisonContent({ ctx }: { ctx: TrainingShellContext }) {
  const comp = useComparison()

  const handleAnswer = (choice: '>' | '<') => {
    const result = comp.answer(choice)
    if (result.correct) {
      ctx.playSound('correct')
    }
    if (result.isSubmit && ctx.state.phase === 'continue') {
      ctx.submit()
    }
  }

  const { problem, errorCount, hintUsed, hintMessage, showStar, isAutoAdvancing } = comp

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4">
      {/* Numbers */}
      <div className={`flex items-center gap-6 mb-10 ${errorCount > 0 && !isAutoAdvancing ? 'animate-shake' : ''}`}>
        <div className="w-28 h-28 rounded-2xl bg-comparison-light border-2 border-comparison/30 flex items-center justify-center">
          <span className="text-5xl font-bold">{problem.left}</span>
        </div>
        <div className="text-3xl text-text-secondary font-bold">?</div>
        <div className="w-28 h-28 rounded-2xl bg-comparison-light border-2 border-comparison/30 flex items-center justify-center">
          <span className="text-5xl font-bold">{problem.right}</span>
        </div>
      </div>

      {/* Hint button */}
      {errorCount >= 1 && !hintUsed && !isAutoAdvancing && (
        <button
          onClick={comp.requestHint}
          className="min-h-12 px-6 rounded-xl bg-secondary-light/30 text-secondary font-semibold active:scale-95 transition-transform mb-4"
        >
          💡 看提示
        </button>
      )}

      <MascotBubble message={hintMessage || ''} visible={!!hintMessage} />

      {/* Answer buttons */}
      <div className="flex gap-6 mt-6">
        <button
          onClick={() => handleAnswer('>')}
          disabled={isAutoAdvancing}
          className="w-24 h-24 rounded-2xl bg-primary text-white text-4xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-40"
        >
          &gt;
        </button>
        <button
          onClick={() => handleAnswer('<')}
          disabled={isAutoAdvancing}
          className="w-24 h-24 rounded-2xl bg-primary text-white text-4xl font-bold shadow-md active:scale-95 transition-transform disabled:opacity-40"
        >
          &lt;
        </button>
      </div>

      <StarReward visible={showStar} />
    </div>
  )
}

export default function ComparisonTrainingPage() {
  return (
    <TrainingShell module="comparison">
      {(ctx) => <ComparisonContent ctx={ctx} />}
    </TrainingShell>
  )
}
