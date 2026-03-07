import type { PlaybackState } from '../../hooks/usePoemTts'

interface Props {
  state: PlaybackState
  currentIndex: number
  segmentCount: number
  ttsEnabled: boolean
  ttsAvailable: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onNext: () => void
  onPrev: () => void
  onReplay: () => void
}

export default function PoemPlaybackBar({
  state,
  currentIndex,
  segmentCount,
  ttsEnabled,
  ttsAvailable,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNext,
  onPrev,
  onReplay,
}: Props) {
  const disabled = !ttsEnabled || !ttsAvailable
  const isPlaying = state === 'playing'
  const isPaused = state === 'paused'
  const isIdle = state === 'idle'
  const isFinished = state === 'finished'

  const canPrev = currentIndex > 0 && (isPlaying || isPaused)
  const canNext = currentIndex < segmentCount - 1 && (isPlaying || isPaused)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg z-40">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center gap-2">
        {/* 上一句 */}
        <ControlButton
          onClick={onPrev}
          disabled={disabled || !canPrev}
          label="上一句"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </ControlButton>

        {/* 重读 */}
        <ControlButton
          onClick={onReplay}
          disabled={disabled || (isIdle && currentIndex < 0)}
          label="重读"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </ControlButton>

        {/* 播放/暂停 - 主按钮 */}
        {isPlaying ? (
          <button
            onClick={onPause}
            disabled={disabled}
            className="w-14 h-14 rounded-full bg-poem text-white flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-40"
            aria-label="暂停"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={isPaused ? onResume : onPlay}
            disabled={disabled}
            className="w-14 h-14 rounded-full bg-poem text-white flex items-center justify-center shadow-md active:scale-95 transition-transform disabled:opacity-40"
            aria-label={isPaused ? '继续' : '播放'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        )}

        {/* 停止 */}
        <ControlButton
          onClick={onStop}
          disabled={disabled || (isIdle && !isFinished)}
          label="停止"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </ControlButton>

        {/* 下一句 */}
        <ControlButton
          onClick={onNext}
          disabled={disabled || !canNext}
          label="下一句"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6h2v12h-2zm-10 6l8.5 6V6z" transform="scale(-1,1) translate(-24,0)" />
          </svg>
        </ControlButton>
      </div>

      {/* TTS 不可用提示 */}
      {!ttsAvailable && ttsEnabled && (
        <div className="text-center text-xs text-text-secondary pb-2 -mt-1">
          TTS 服务未连接，请检查服务是否已启动
        </div>
      )}
    </div>
  )
}

function ControlButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-11 h-11 rounded-full bg-gray-100 text-text flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30"
      aria-label={label}
    >
      {children}
    </button>
  )
}
