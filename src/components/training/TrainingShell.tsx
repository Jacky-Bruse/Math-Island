import { type ReactNode, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TrainingState, TrainingModule } from '../../types/training'
import { useSettings } from '../../hooks/useSettings'
import { useSound, type SoundType } from '../../hooks/useSound'
import { useTrainingSession } from '../../hooks/useTrainingSession'
import { useTrainingTimer } from '../../hooks/useTrainingTimer'
import MuteToggle from '../shared/MuteToggle'
import BackButton from '../shared/BackButton'
import ConfirmDialog from '../shared/ConfirmDialog'
import BreakPromptOverlay from './BreakPromptOverlay'
import RestCountdown from './RestCountdown'
import EndingOverlay from './EndingOverlay'
import TrainingSummaryOverlay from './TrainingSummaryOverlay'

interface Props {
  module: TrainingModule
  children: (ctx: TrainingShellContext) => ReactNode
}

export interface TrainingShellContext {
  state: TrainingState
  submit: () => void
  finish: () => void
  exitToHome: () => void
  recordCompleted: (count?: number) => void
  recordError: (count?: number) => void
  playSound: (type: SoundType) => void
  isMuted: boolean
}

interface TrainingStats {
  completedCount: number
  errorCount: number
}

export default function TrainingShell({ module, children }: Props) {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const { play: playSound } = useSound(!settings.sound)
  const session = useTrainingSession(module)
  const { state, start, triggerCheckpoint, chooseRest, chooseContinueTraining, chooseContinue, restDone, submit, finish, reset } = session
  const prevPhaseRef = useRef<TrainingState['phase']>(state.phase)

  const [elapsed, setElapsed] = useState(0)
  const [exitConfirm, setExitConfirm] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [stats, setStats] = useState<TrainingStats>({ completedCount: 0, errorCount: 0 })

  const onCheckpoint = useCallback(triggerCheckpoint, [triggerCheckpoint])

  useTrainingTimer({
    state,
    duration: settings.trainingDuration,
    onCheckpoint,
  })

  // Auto-start on mount
  useEffect(() => {
    if (state.phase === 'idle') {
      start(settings.trainingDuration)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update elapsed display
  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'ending') return
    if (!('startedAt' in state)) return

    const timer = setInterval(() => {
      setElapsed(Date.now() - state.startedAt)
    }, 1000)
    return () => clearInterval(timer)
  }, [state])

  // Play completion sound when entering ending phase.
  useEffect(() => {
    if (state.phase === 'ending' && prevPhaseRef.current !== 'ending') {
      playSound('complete')
    }
    prevPhaseRef.current = state.phase
  }, [state.phase, playSound])

  const toggleMute = () => updateSettings({ sound: !settings.sound })

  const handleBack = () => setExitConfirm(true)
  const confirmExit = () => {
    setExitConfirm(false)
    setSummaryOpen(true)
  }

  const exitToHome = useCallback(() => {
    setSummaryOpen(true)
  }, [])

  const recordCompleted = useCallback((count = 1) => {
    if (count <= 0) return
    setStats(prev => ({ ...prev, completedCount: prev.completedCount + count }))
  }, [])

  const recordError = useCallback((count = 1) => {
    if (count <= 0) return
    setStats(prev => ({ ...prev, errorCount: prev.errorCount + count }))
  }, [])

  const finishToHome = useCallback(() => {
    setSummaryOpen(false)
    reset()
    navigate('/')
  }, [navigate, reset])

  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  const totalMinutes = settings.trainingDuration
  const progress = Math.min(1, elapsed / (totalMinutes * 60 * 1000))

  const ctx: TrainingShellContext = {
    state,
    submit,
    finish,
    exitToHome,
    recordCompleted,
    recordError,
    playSound,
    isMuted: !settings.sound,
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <BackButton onConfirm={handleBack} needConfirm />
        <div className="flex-1 mx-2">
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="text-xs text-text-secondary text-center mt-1 tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')} / {totalMinutes}:00
          </div>
        </div>
        <MuteToggle isMuted={!settings.sound} onToggle={toggleMute} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {(state.phase === 'running' || state.phase === 'continue') && children(ctx)}
      </div>

      {/* Overlays */}
      {state.phase === 'breakPrompt' && (
        <BreakPromptOverlay
          breakSource={state.breakSource}
          module={module}
          completedCount={stats.completedCount}
          errorCount={stats.errorCount}
          onRest={chooseRest}
          onContinue={state.breakSource === 'midway' ? chooseContinueTraining : chooseContinue}
        />
      )}

      {state.phase === 'resting' && (
        <RestCountdown onDone={restDone} />
      )}

      {state.phase === 'ending' && (
        <EndingOverlay onReset={reset} />
      )}

      <TrainingSummaryOverlay
        open={summaryOpen}
        module={module}
        completedCount={stats.completedCount}
        errorCount={stats.errorCount}
        onGoHome={finishToHome}
      />

      {/* Exit confirm */}
      <ConfirmDialog
        open={exitConfirm}
        title="退出训练"
        onConfirm={confirmExit}
        onCancel={() => setExitConfirm(false)}
        confirmText="退出"
        cancelText="继续训练"
      >
        <p>退出后当前训练进度不会保存，确定退出吗？</p>
      </ConfirmDialog>
    </div>
  )
}
