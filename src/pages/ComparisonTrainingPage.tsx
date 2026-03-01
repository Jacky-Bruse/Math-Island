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
    } else {
      ctx.playSound('wrong')
    }
    if (!result.correct) {
      ctx.recordError()
    }
    if (result.isSubmit) {
      ctx.recordCompleted()
    }
    if (result.isSubmit && ctx.state.phase === 'continue') {
      ctx.submit()
    }
  }

  const { problem, errorCount, hintUsed, hintMessage, showStar, isAutoAdvancing } = comp

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-3 sm:px-4 md:px-6">
      {/* Numbers */}
      <div className={`flex items-center gap-4 md:gap-6 mb-8 md:mb-10 ${errorCount > 0 && !isAutoAdvancing ? 'animate-shake' : ''}`}>
        <div className="w-[clamp(6.8rem,20vw,11rem)] h-[clamp(6.8rem,20vw,11rem)] rounded-2xl md:rounded-3xl bg-comparison-light border-2 border-comparison/30 flex items-center justify-center">
          <span className="text-[clamp(2.6rem,7vw,4.5rem)] font-bold tabular-nums">{problem.left}</span>
        </div>
        <div className="text-[clamp(1.8rem,4.6vw,3rem)] text-text-secondary font-bold">?</div>
        <div className="w-[clamp(6.8rem,20vw,11rem)] h-[clamp(6.8rem,20vw,11rem)] rounded-2xl md:rounded-3xl bg-comparison-light border-2 border-comparison/30 flex items-center justify-center">
          <span className="text-[clamp(2.6rem,7vw,4.5rem)] font-bold tabular-nums">{problem.right}</span>
        </div>
      </div>

      {/* Hint button */}
      {errorCount >= 1 && !hintUsed && !isAutoAdvancing && (
        <button
          onClick={comp.requestHint}
          className="min-h-[3.2rem] md:min-h-14 px-5 md:px-6 text-base md:text-lg rounded-xl bg-secondary-light/30 text-secondary font-semibold active:scale-95 transition-transform mb-4"
        >
          💡 看提示
        </button>
      )}

      <MascotBubble message={hintMessage || ''} visible={!!hintMessage} />

      {/* Answer buttons */}
      <div className="flex gap-4 md:gap-6 mt-5 md:mt-6">
        <button
          onClick={() => handleAnswer('>')}
          disabled={isAutoAdvancing}
          className="w-[clamp(5.4rem,16vw,8.5rem)] h-[clamp(5.4rem,16vw,8.5rem)] rounded-2xl md:rounded-3xl bg-primary text-white text-[clamp(2rem,5.2vw,3.6rem)] font-bold shadow-md active:scale-95 transition-transform disabled:opacity-40"
        >
          &gt;
        </button>
        <button
          onClick={() => handleAnswer('<')}
          disabled={isAutoAdvancing}
          className="w-[clamp(5.4rem,16vw,8.5rem)] h-[clamp(5.4rem,16vw,8.5rem)] rounded-2xl md:rounded-3xl bg-primary text-white text-[clamp(2rem,5.2vw,3.6rem)] font-bold shadow-md active:scale-95 transition-transform disabled:opacity-40"
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
