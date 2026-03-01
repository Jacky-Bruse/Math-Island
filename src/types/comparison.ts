export interface ComparisonProblem {
  left: number
  right: number
  correctAnswer: '>' | '<'
  sameTens: boolean
}
