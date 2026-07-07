export type PoemTtsMode = 'normal' | 'follow'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Settings {
  theme: ThemeMode
  sound: boolean
  trainingDuration: 15 | 20 | 30
  poemTtsEnabled: boolean
  poemTtsUseCustomService: boolean
  poemTtsServiceUrl: string
  poemTtsVoice: string
  poemTtsRate: number
  poemTtsPitch: number
  poemTtsMode: PoemTtsMode
  poemTtsFollowPauseSeconds: number
  poemReadTitle: boolean
  poemReadMeta: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: true,
  trainingDuration: 20,
  poemTtsEnabled: true,
  poemTtsUseCustomService: false,
  poemTtsServiceUrl: '',
  poemTtsVoice: 'zh-CN-XiaoxiaoNeural',
  poemTtsRate: 1.0,
  poemTtsPitch: 1.0,
  poemTtsMode: 'normal',
  poemTtsFollowPauseSeconds: 1.8,
  poemReadTitle: true,
  poemReadMeta: true,
}
