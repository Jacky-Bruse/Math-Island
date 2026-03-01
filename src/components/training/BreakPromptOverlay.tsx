import type { BreakSource } from '../../types/training'

interface Props {
  breakSource: BreakSource
  onRest: () => void
  onContinue: () => void
}

export default function BreakPromptOverlay({ breakSource, onRest, onContinue }: Props) {
  const isMidway = breakSource === 'midway'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-3xl shadow-xl p-8 mx-6 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">{isMidway ? '⏰' : '🎉'}</div>
        <h2 className="text-xl font-bold mb-2">
          {isMidway ? '训练过半啦！' : '训练时间到！'}
        </h2>
        <p className="text-text-secondary mb-6">
          {isMidway ? '休息一下再继续吧' : '你做得很棒！休息一下吧'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onRest}
            className="w-full min-h-14 rounded-xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform"
          >
            休息 3 分钟
          </button>
          <button
            onClick={onContinue}
            className="w-full min-h-14 rounded-xl bg-gray-100 text-text font-semibold active:scale-95 transition-transform"
          >
            {isMidway ? '继续训练' : '继续'}
          </button>
        </div>
      </div>
    </div>
  )
}
