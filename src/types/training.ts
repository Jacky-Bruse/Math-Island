export type TrainingModule = 'arithmetic' | 'comparison' | 'sudoku'

export type BreakSource = 'midway' | 'endpoint'

export type TrainingState =
  | { phase: 'idle' }
  | { phase: 'running'; startedAt: number; checkpoints: number[] }
  | { phase: 'breakPrompt'; breakSource: BreakSource; startedAt: number; checkpoints: number[] }
  | { phase: 'resting'; breakSource: BreakSource; startedAt: number; restStartedAt: number; checkpoints: number[] }
  | { phase: 'continue'; startedAt: number; validSubmissions: number }
  | { phase: 'ending'; startedAt: number }

export type TrainingAction =
  | { type: 'START'; duration: 15 | 20 | 30 }
  | { type: 'CHECKPOINT'; breakSource: BreakSource }
  | { type: 'CHOOSE_REST' }
  | { type: 'CHOOSE_CONTINUE_TRAINING' }
  | { type: 'CHOOSE_CONTINUE' }
  | { type: 'REST_DONE' }
  | { type: 'SUBMIT' }
  | { type: 'FINISH' }
  | { type: 'RESET' }
