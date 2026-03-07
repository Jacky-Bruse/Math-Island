export interface Poem {
  id: string
  title: string
  author?: string
  dynasty?: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface PoemSegment {
  type: 'title' | 'meta' | 'line'
  text: string
}
