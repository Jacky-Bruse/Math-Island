import { useParams } from 'react-router-dom'
import TrainingShell from '../components/training/TrainingShell'
import type { TrainingShellContext } from '../components/training/TrainingShell'
import NumberKeyboard from '../components/shared/NumberKeyboard'
import MascotBubble from '../components/shared/MascotBubble'
import StarReward from '../components/shared/StarReward'
import { useArithmetic } from '../hooks/useArithmetic'
import type { ArithmeticRange } from '../types/arithmetic'

function ArithmeticContent({ ctx }: { ctx: TrainingShellContext }) {
  const params = useParams()
  const range = (Number(params.range) || 10) as ArithmeticRange
  const arith = useArithmetic(range)
  const { input } = arith

  const handleConfirm = () => {
    if (input === '') return

    const result = arith.confirm()
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

  const { problem, errorCount, hintUsed, hintMessage, showStar, isAutoAdvancing } = arith

  return (
    <div className="flex-1 flex flex-col justify-between pt-2">
      {/* Problem display */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6">
        <div className={`font-bold mb-6 md:mb-8 tabular-nums leading-tight text-[clamp(2.5rem,8.5vw,4.5rem)] ${errorCount > 0 && !isAutoAdvancing ? 'animate-shake' : ''}`}>
          <span>{problem.a}</span>
          <span className="mx-2 md:mx-3 text-primary">{problem.operator === '+' ? '+' : '-'}</span>
          <span>{problem.b}</span>
          <span className="mx-2 md:mx-3">=</span>
          <span className="inline-block min-w-[clamp(3.8rem,12vw,7rem)] text-center border-b-[5px] border-primary/30">
            {input || <span className="text-gray-300">?</span>}
          </span>
        </div>

        {/* Hint button */}
        {errorCount >= 1 && !hintUsed && !isAutoAdvancing && (
          <button
            onClick={arith.requestHint}
            className="min-h-[3.2rem] md:min-h-14 px-5 md:px-6 text-base md:text-lg rounded-xl bg-secondary-light/30 text-secondary font-semibold active:scale-95 transition-transform mb-4"
          >
            💡 看提示
          </button>
        )}

        <MascotBubble message={hintMessage || ''} visible={!!hintMessage} />
      </div>

      {/* Keyboard */}
      <div className="px-1 sm:px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5">
        <NumberKeyboard
          onInput={arith.inputDigit}
          onBackspace={arith.backspace}
          onClear={arith.clear}
          onConfirm={handleConfirm}
          disabled={isAutoAdvancing}
        />
      </div>

      <StarReward visible={showStar} />
    </div>
  )
}

export default function ArithmeticTrainingPage() {
  return (
    <TrainingShell module="arithmetic">
      {(ctx) => <ArithmeticContent ctx={ctx} />}
    </TrainingShell>
  )
}
