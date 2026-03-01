import { useReducer, useCallback } from 'react'
import type { TrainingState, TrainingAction, BreakSource, TrainingModule } from '../types/training'

function getCheckpoints(duration: 15 | 20 | 30): number[] {
  if (duration === 30) return [15 * 60 * 1000, 30 * 60 * 1000]
  return [duration * 60 * 1000]
}

function getBreakSource(checkpoints: number[], triggeredIndex: number): BreakSource {
  if (checkpoints.length === 2 && triggeredIndex === 0) return 'midway'
  return 'endpoint'
}

function reducer(state: TrainingState, action: TrainingAction): TrainingState {
  switch (action.type) {
    case 'START': {
      const checkpoints = getCheckpoints(action.duration)
      return { phase: 'running', startedAt: Date.now(), checkpoints }
    }

    case 'CHECKPOINT': {
      if (state.phase !== 'running') return state
      return {
        phase: 'breakPrompt',
        breakSource: action.breakSource,
        startedAt: state.startedAt,
        checkpoints: state.checkpoints,
      }
    }

    case 'CHOOSE_REST': {
      if (state.phase !== 'breakPrompt') return state
      return {
        phase: 'resting',
        breakSource: state.breakSource,
        startedAt: state.startedAt,
        restStartedAt: Date.now(),
        checkpoints: state.checkpoints,
      }
    }

    case 'CHOOSE_CONTINUE_TRAINING': {
      if (state.phase !== 'breakPrompt') return state
      if (state.breakSource !== 'midway') return state
      return {
        phase: 'running',
        startedAt: state.startedAt,
        checkpoints: state.checkpoints,
      }
    }

    case 'CHOOSE_CONTINUE': {
      if (state.phase !== 'breakPrompt') return state
      if (state.breakSource !== 'endpoint') return state
      return {
        phase: 'continue',
        startedAt: state.startedAt,
        validSubmissions: 0,
      }
    }

    case 'REST_DONE': {
      if (state.phase !== 'resting') return state
      if (state.breakSource === 'midway') {
        return {
          phase: 'running',
          startedAt: state.startedAt,
          checkpoints: state.checkpoints,
        }
      }
      return {
        phase: 'continue',
        startedAt: state.startedAt,
        validSubmissions: 0,
      }
    }

    case 'SUBMIT': {
      if (state.phase !== 'continue') return state
      const next = state.validSubmissions + 1
      if (next >= 3) {
        return { phase: 'ending', startedAt: state.startedAt }
      }
      return { ...state, validSubmissions: next }
    }

    case 'FINISH': {
      if (state.phase === 'idle') return state
      return { phase: 'ending', startedAt: 'startedAt' in state ? state.startedAt : Date.now() }
    }

    case 'RESET':
      return { phase: 'idle' }

    default:
      return state
  }
}

export function useTrainingSession(_module: TrainingModule) {
  const [state, dispatch] = useReducer(reducer, { phase: 'idle' })

  const start = useCallback((duration: 15 | 20 | 30) => {
    dispatch({ type: 'START', duration })
  }, [])

  const triggerCheckpoint = useCallback((breakSource: BreakSource) => {
    dispatch({ type: 'CHECKPOINT', breakSource })
  }, [])

  const chooseRest = useCallback(() => dispatch({ type: 'CHOOSE_REST' }), [])
  const chooseContinueTraining = useCallback(() => dispatch({ type: 'CHOOSE_CONTINUE_TRAINING' }), [])
  const chooseContinue = useCallback(() => dispatch({ type: 'CHOOSE_CONTINUE' }), [])
  const restDone = useCallback(() => dispatch({ type: 'REST_DONE' }), [])
  const submit = useCallback(() => dispatch({ type: 'SUBMIT' }), [])
  const finish = useCallback(() => dispatch({ type: 'FINISH' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return {
    state,
    start,
    triggerCheckpoint,
    chooseRest,
    chooseContinueTraining,
    chooseContinue,
    restDone,
    submit,
    finish,
    reset,
    getCheckpoints,
    getBreakSource,
  }
}

export { getCheckpoints, getBreakSource }
