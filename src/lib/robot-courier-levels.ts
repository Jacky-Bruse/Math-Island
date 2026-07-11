import type { RobotCourierEdge, RobotCourierLevel, RobotCourierNode } from '../types/robot-courier.ts'

type Point = readonly [id: string, x: number, y: number]
type Edge = readonly [from: string, to: string]

function makeLevel(
  id: number,
  points: readonly Point[],
  solution: readonly string[],
  extraEdges: readonly Edge[] = [],
): RobotCourierLevel {
  const nodes: RobotCourierNode[] = points.map(([nodeId, x, y]) => ({
    id: nodeId,
    x,
    y,
    type: nodeId === 'start' ? 'start' : nodeId === 'target' ? 'target' : 'checkpoint',
  }))
  const pathEdges: RobotCourierEdge[] = solution.slice(0, -1).map((from, index) => [from, solution[index + 1]!])
  return { id, nodes, edges: [...pathEdges, ...extraEdges] }
}

export const levels: readonly RobotCourierLevel[] = [
  makeLevel(1, [['start', 10, 50], ['a', 50, 50], ['target', 90, 50]], ['start', 'a', 'target']),
  makeLevel(2, [['start', 10, 70], ['a', 35, 25], ['b', 65, 70], ['target', 90, 25]], ['start', 'a', 'b', 'target']),
  makeLevel(3, [['start', 10, 55], ['a', 45, 20], ['b', 28, 80], ['c', 72, 65], ['target', 90, 25]], ['start', 'b', 'a', 'c', 'target'], [['start', 'a']]),
  makeLevel(4, [['start', 10, 50], ['a', 45, 20], ['b', 70, 75], ['c', 30, 75], ['target', 90, 50]], ['start', 'c', 'a', 'b', 'target'], [['start', 'a']]),
  makeLevel(5, [['start', 8, 80], ['a', 55, 18], ['b', 25, 55], ['c', 78, 75], ['d', 45, 82], ['target', 92, 30]], ['start', 'b', 'd', 'a', 'c', 'target'], [['start', 'd']]),
  makeLevel(6, [['start', 8, 45], ['a', 48, 20], ['b', 78, 75], ['c', 28, 78], ['d', 62, 55], ['target', 92, 30]], ['start', 'c', 'a', 'd', 'b', 'target'], [['start', 'a']]),
  makeLevel(7, [['start', 8, 55], ['a', 50, 15], ['b', 25, 30], ['c', 65, 75], ['d', 80, 45], ['e', 42, 82], ['target', 94, 65]], ['start', 'b', 'e', 'c', 'a', 'd', 'target'], [['start', 'e']]),
  makeLevel(8, [['start', 8, 75], ['a', 38, 18], ['b', 65, 82], ['c', 82, 30], ['d', 25, 60], ['e', 55, 45], ['target', 94, 60]], ['start', 'd', 'a', 'e', 'b', 'c', 'target'], [['start', 'a']]),
  makeLevel(9, [['start', 8, 50], ['a', 55, 18], ['b', 78, 70], ['c', 25, 75], ['d', 62, 82], ['e', 42, 38], ['target', 94, 35]], ['start', 'c', 'e', 'a', 'd', 'b', 'target'], [['start', 'e'], ['a', 'b']]),
  makeLevel(10, [['start', 8, 75], ['a', 25, 25], ['b', 58, 70], ['c', 82, 22], ['d', 45, 42], ['e', 74, 60], ['target', 94, 72]], ['start', 'a', 'd', 'b', 'e', 'c', 'target'], [['start', 'd'], ['b', 'c']]),
  makeLevel(11, [['start', 8, 50], ['a', 62, 78], ['b', 48, 28], ['c', 82, 45], ['d', 65, 52], ['e', 25, 75], ['target', 94, 20]], ['start', 'e', 'b', 'd', 'a', 'c', 'target'], [['start', 'b'], ['d', 'c']]),
  makeLevel(12, [['start', 8, 72], ['a', 68, 18], ['b', 25, 75], ['c', 45, 35], ['d', 82, 72], ['e', 58, 80], ['target', 94, 35]], ['start', 'b', 'c', 'e', 'a', 'd', 'target'], [['start', 'c'], ['e', 'd']]),
  makeLevel(13, [['start', 8, 45], ['a', 50, 82], ['b', 38, 35], ['c', 82, 65], ['d', 22, 75], ['e', 68, 20], ['target', 94, 32]], ['start', 'd', 'b', 'a', 'e', 'c', 'target'], [['start', 'b'], ['d', 'e']]),
  makeLevel(14, [['start', 8, 65], ['a', 38, 22], ['b', 78, 78], ['c', 25, 55], ['d', 62, 62], ['e', 55, 18], ['target', 94, 40]], ['start', 'c', 'a', 'e', 'd', 'b', 'target'], [['start', 'a'], ['e', 'b']]),
  makeLevel(15, [['start', 8, 50], ['a', 45, 18], ['b', 25, 75], ['c', 70, 78], ['d', 84, 45], ['e', 40, 60], ['f', 58, 38], ['target', 94, 70]], ['start', 'b', 'e', 'a', 'f', 'c', 'd', 'target'], [['start', 'e'], ['a', 'd']]),
  makeLevel(16, [['start', 8, 75], ['a', 58, 80], ['b', 42, 35], ['c', 82, 48], ['d', 42, 60], ['e', 72, 18], ['f', 22, 40], ['target', 94, 25]], ['start', 'f', 'b', 'd', 'a', 'e', 'c', 'target'], [['start', 'b'], ['d', 'c']]),
  makeLevel(17, [['start', 8, 45], ['a', 55, 18], ['b', 70, 75], ['c', 28, 70], ['d', 62, 48], ['e', 82, 35], ['f', 42, 35], ['target', 94, 70]], ['start', 'c', 'f', 'a', 'd', 'b', 'e', 'target'], [['start', 'f'], ['a', 'e']]),
  makeLevel(18, [['start', 8, 70], ['a', 68, 78], ['b', 42, 35], ['c', 82, 25], ['d', 58, 55], ['e', 25, 78], ['f', 48, 18], ['target', 94, 60]], ['start', 'e', 'b', 'f', 'd', 'a', 'c', 'target'], [['start', 'b'], ['f', 'c']]),
  makeLevel(19, [['start', 8, 50], ['a', 35, 70], ['b', 65, 35], ['c', 82, 72], ['d', 25, 25], ['e', 72, 55], ['f', 48, 82], ['target', 94, 30]], ['start', 'd', 'a', 'f', 'b', 'e', 'c', 'target'], [['start', 'a'], ['f', 'c']]),
  makeLevel(20, [['start', 8, 75], ['a', 50, 20], ['b', 70, 75], ['c', 35, 45], ['d', 84, 45], ['e', 58, 55], ['f', 22, 22], ['target', 94, 70]], ['start', 'f', 'c', 'a', 'e', 'b', 'd', 'target'], [['start', 'c'], ['a', 'd'], ['e', 'd']]),
]
