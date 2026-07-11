import assert from 'node:assert/strict'
import { levels } from '../src/lib/robot-courier-levels.ts'
import * as robotCourier from '../src/lib/robot-courier.ts'
import {
  canMove,
  findHint,
  findSolutions,
  isComplete,
  validateLevel,
} from '../src/lib/robot-courier.ts'

type PointMapper = (clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }) => { x: number; y: number } | null
const clientPointToViewBox = (robotCourier as unknown as { clientPointToViewBox?: PointMapper }).clientPointToViewBox
assert.equal(typeof clientPointToViewBox, 'function', '需要提供考虑 SVG 留白的坐标换算')
assert.deepEqual(clientPointToViewBox?.(248, 300, { left: 0, top: 0, width: 1000, height: 600 }), { x: 8, y: 50 })
assert.deepEqual(clientPointToViewBox?.(500, 300, { left: 0, top: 0, width: 1000, height: 600 }), { x: 50, y: 50 })

function pointToSegmentDistance(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y)
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy))
}

assert.equal(levels.length, 20)

for (const level of levels) {
  assert.deepEqual(validateLevel(level), [], `关卡 ${level.id} 不合法`)
  assert.equal(findSolutions(level).length, 1, `关卡 ${level.id} 必须恰好一个解`)
  for (const [index, node] of level.nodes.entries()) {
    for (const other of level.nodes.slice(index + 1)) {
      assert.ok(Math.hypot(node.x - other.x, node.y - other.y) >= 12, `关卡 ${level.id} 节点 ${node.id}-${other.id} 距离不足 12`)
    }
  }
  const nodes = new Map(level.nodes.map(node => [node.id, node]))
  for (const [from, to] of level.edges) {
    const start = nodes.get(from)
    const end = nodes.get(to)
    assert.ok(start && end, `关卡 ${level.id} 航线端点不存在`)
    for (const node of level.nodes) {
      if (node.id === from || node.id === to) continue
      assert.ok(pointToSegmentDistance(node, start, end) >= 8, `关卡 ${level.id} 航线 ${from}-${to} 过近节点 ${node.id}`)
    }
  }
}

const contentSignatures = levels.map(level => JSON.stringify({ nodes: level.nodes, edges: level.edges }))
assert.equal(new Set(contentSignatures).size, levels.length, '关卡内容不得重复')

const solutionOrders = levels.map(level => findSolutions(level, 1)[0]?.join('>'))
assert.ok(new Set(solutionOrders).size >= 12, '20 关需要足够多样的正确路线')
assert.ok(levels.slice(14).every(level => level.nodes.length === 8), '第 15–20 关应使用 8 个节点')
assert.ok(levels[2]?.edges.some(([from, to]) => from === 'start' && to === 'a'), '第 3 关需要 start-a 教学分叉')

const first = levels[0]
assert.ok(first)
const solution = findSolutions(first)[0]
assert.ok(solution)
assert.equal(solution[0], 'start')
assert.equal(solution.at(-1), 'target')
assert.equal(isComplete(first, solution), true)

assert.equal(canMove(first, ['start'], solution[1] ?? ''), true)
assert.equal(canMove(first, ['start'], 'target'), false)
assert.equal(canMove(first, [solution[0] ?? '', solution[1] ?? ''], solution[1] ?? ''), false)
assert.equal(findHint(first, ['start']), solution[1])
assert.equal(findHint(first, solution), null)

console.log('robot courier logic checks passed')
