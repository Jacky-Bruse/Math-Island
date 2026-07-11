export type RobotCourierNodeType = 'start' | 'checkpoint' | 'target'

export interface RobotCourierNode {
  id: string
  x: number
  y: number
  type: RobotCourierNodeType
}

export type RobotCourierEdge = readonly [from: string, to: string]

export interface RobotCourierLevel {
  id: number
  nodes: readonly RobotCourierNode[]
  edges: readonly RobotCourierEdge[]
}

export interface RobotCourierProgress {
  version: 1
  unlockedLevel: number
  bestStars: Partial<Record<number, 1 | 2 | 3>>
}
