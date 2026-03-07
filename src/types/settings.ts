export interface Settings {
  sound: boolean
  trainingDuration: 15 | 20 | 30
  defaultSudokuSize: 4 | 6 | 8
  poemTtsEnabled: boolean
  poemTtsUseCustomService: boolean
  poemTtsServiceUrl: string
  poemTtsVoice: string
  poemTtsRate: number
  poemTtsPitch: number
  poemReadTitle: boolean
  poemReadMeta: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  trainingDuration: 20,
  defaultSudokuSize: 4,
  poemTtsEnabled: true,
  poemTtsUseCustomService: false,
  poemTtsServiceUrl: '',
  poemTtsVoice: 'zh-CN-XiaoxiaoNeural',
  poemTtsRate: 1.0,
  poemTtsPitch: 1.0,
  poemReadTitle: true,
  poemReadMeta: true,
}
