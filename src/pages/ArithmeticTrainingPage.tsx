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

  const handleConfirm = () => {
    const result = arith.confirm()
    if (result.correct) {
      ctx.playSound('correct')
    }
    if (result.isSubmit && ctx.state.phase === 'continue') {
      ctx.submit()
    }
  }

  const { problem, input, errorCount, hintUsed, hintMessage, showStar, isAutoAdvancing } = arith

  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Problem display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className={`text-5xl font-bold mb-8 tabular-nums ${errorCount > 0 && !isAutoAdvancing ? 'animate-shake' : ''}`}>
          <span>{problem.a}</span>
          <span className="mx-3 text-primary">{problem.operator === '+' ? '+' : '−'}</span>
          <span>{problem.b}</span>
          <span className="mx-3">=</span>
          <span className="inline-block min-w-16 text-center border-b-4 border-primary/30">
            {input || <span className="text-gray-300">?</span>}
          </span>
        </div>

        {/* Hint button */}
        {errorCount >= 1 && !hintUsed && !isAutoAdvancing && (
          <button
            onClick={arith.requestHint}
            className="min-h-12 px-6 rounded-xl bg-secondary-light/30 text-secondary font-semibold active:scale-95 transition-transform mb-4"
          >
            💡 看提示
          </button>
        )}

        <MascotBubble message={hintMessage || ''} visible={!!hintMessage} />
      </div>

      {/* Keyboard */}
      <div className="pb-4">
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
