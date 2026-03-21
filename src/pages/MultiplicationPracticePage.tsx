import { useParams } from 'react-router-dom'
import NumberKeyboard from '../components/shared/NumberKeyboard'
import MascotBubble from '../components/shared/MascotBubble'
import StarReward from '../components/shared/StarReward'
import TrainingShell from '../components/training/TrainingShell'
import type { TrainingShellContext } from '../components/training/TrainingShell'
import { useMultiplicationPractice } from '../hooks/useMultiplicationPractice'
import type { PracticeLevel } from '../types/multiplication'

function MultiplicationPracticeContent({ ctx }: { ctx: TrainingShellContext }) {
  const params = useParams<{ level: string }>()
  const level = (Number(params.level) || 2) as PracticeLevel
  const practice = useMultiplicationPractice(level)

  const handleConfirm = () => {
    if (practice.input === '') return

    const result = practice.confirm()
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

  return (
    <div className="flex-1 flex flex-col justify-between pt-3">
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6">
        <div className="mb-4 rounded-full bg-[#fff3e6] px-4 py-2 text-sm font-bold text-[#c2410c]">
          练到 {level}
        </div>

        <div className={`rounded-[2rem] border px-6 py-8 text-center shadow-sm transition-all ${
          practice.errorCount > 0 && !practice.isAutoAdvancing
            ? 'animate-shake border-danger-light/70 bg-white'
            : 'border-[#fed7aa] bg-[linear-gradient(145deg,#fffdfb,#fff3e6)]'
        }`}
        >
          <div className="text-xs font-bold uppercase tracking-[0.26em] text-[#fb923c]">Current Prompt</div>
          <div className="mt-4 text-[clamp(2rem,7vw,4rem)] font-black leading-tight text-[#7c2d12]">
            {practice.prompt}
          </div>
          <div className="mt-4 text-sm text-text-secondary">
            对应口诀：{practice.fact.chant}
          </div>
          <div className="mt-6 text-[clamp(2.2rem,8vw,4.2rem)] font-black tabular-nums text-primary">
            {practice.input || <span className="text-gray-300">?</span>}
          </div>
        </div>

        {practice.errorCount >= 1 && !practice.hintUsed && !practice.isAutoAdvancing && (
          <button
            type="button"
            onClick={practice.requestHint}
            className="mt-5 min-h-[3.2rem] rounded-xl bg-secondary-light/30 px-5 text-base font-semibold text-secondary active:scale-95 transition-transform"
          >
            💡 看提示
          </button>
        )}

        <MascotBubble message={practice.hintMessage || ''} visible={!!practice.hintMessage} />
      </div>

      <div className="px-1 sm:px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5">
        <NumberKeyboard
          onInput={practice.inputDigit}
          onBackspace={practice.backspace}
          onClear={practice.clear}
          onConfirm={handleConfirm}
          disabled={practice.isAutoAdvancing}
        />
      </div>

      <StarReward visible={practice.showStar} />
    </div>
  )
}

export default function MultiplicationPracticePage() {
  return (
    <TrainingShell module="multiplication">
      {(ctx) => <MultiplicationPracticeContent ctx={ctx} />}
    </TrainingShell>
  )
}
