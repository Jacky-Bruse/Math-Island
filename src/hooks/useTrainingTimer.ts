import { useEffect, useRef } from 'react'
import type { TrainingState, BreakSource } from '../types/training'
import { getCheckpoints, getBreakSource } from './useTrainingSession'

interface Props {
  state: TrainingState
  duration: 15 | 20 | 30
  onCheckpoint: (breakSource: BreakSource) => void
}

export function useTrainingTimer({ state, duration, onCheckpoint }: Props) {
  const triggeredRef = useRef<Set<number>>(new Set())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningStartedAt = state.phase === 'running' ? state.startedAt : null

  useEffect(() => {
    if (state.phase === 'idle') {
      triggeredRef.current.clear()
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'running' || runningStartedAt === null) {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
      return
    }

    const checkpoints = getCheckpoints(duration)

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - runningStartedAt

      for (let i = 0; i < checkpoints.length; i++) {
        if (elapsed >= checkpoints[i] && !triggeredRef.current.has(i)) {
          triggeredRef.current.add(i)
          const breakSource = getBreakSource(checkpoints, i)
          onCheckpoint(breakSource)
          break
        }
      }
    }, 1000)

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current)
        tickRef.current = null
      }
    }
  }, [state.phase, runningStartedAt, duration, onCheckpoint])

  const getElapsed = (): number => {
    if (state.phase === 'idle') return 0
    if (!('startedAt' in state)) return 0
    return Date.now() - state.startedAt
  }

  return { getElapsed }
}
