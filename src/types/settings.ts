export interface Settings {
  sound: boolean
  trainingDuration: 15 | 20 | 30
  defaultSudokuSize: 4 | 6 | 8
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  trainingDuration: 20,
  defaultSudokuSize: 4,
}
