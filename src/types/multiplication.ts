export type MultiplicationGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type PracticeLevel = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type ReadingMode = 'full-read' | 'group-read' | 'full-follow'
export type MultiplicationDemoMode = 'all-numbered' | 'compact-numbered' | 'grouped'
export type MultiplicationPracticePromptKind = 'equation' | 'chant-forward' | 'chant-reverse'

export interface MultiplicationFact {
  a: number
  b: MultiplicationGroup
  answer: number
  chant: string
  group: MultiplicationGroup
  order: number
  groups: number
  itemsPerGroup: number
  meaningText: string
}

export interface MultiplicationPracticePrompt {
  kind: MultiplicationPracticePromptKind
  prompt: string
  answer: string
}
