export type ArithmeticRange = 10 | 20 | 100
export type Operator = '+' | '-'

export interface ArithmeticProblem {
  a: number
  b: number
  operator: Operator
  answer: number
  isCarryOrBorrow: boolean
}
