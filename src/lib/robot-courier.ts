import type { RobotCourierLevel } from '../types/robot-courier.ts'

export function clientPointToViewBox(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } | null {
  if (rect.width <= 0 || rect.height <= 0) return null
  const scale = Math.min(rect.width / 100, rect.height / 100)
  const offsetX = (rect.width - 100 * scale) / 2
  const offsetY = (rect.height - 100 * scale) / 2
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  }
}

const edgeKey = (from: string, to: string) => [from, to].sort().join('|')

function getStart(level: RobotCourierLevel): string | undefined {
  return level.nodes.find(node => node.type === 'start')?.id
}

function getTarget(level: RobotCourierLevel): string | undefined {
  return level.nodes.find(node => node.type === 'target')?.id
}

function getCheckpointIds(level: RobotCourierLevel): string[] {
  return level.nodes.filter(node => node.type === 'checkpoint').map(node => node.id)
}

function buildAdjacency(level: RobotCourierLevel): Map<string, Set<string>> {
  const adjacency = new Map(level.nodes.map(node => [node.id, new Set<string>()]))
  for (const [from, to] of level.edges) {
    adjacency.get(from)?.add(to)
    adjacency.get(to)?.add(from)
  }
  return adjacency
}

function hasAllCheckpoints(level: RobotCourierLevel, path: readonly string[]): boolean {
  const visited = new Set(path)
  return getCheckpointIds(level).every(id => visited.has(id))
}

export function canMove(level: RobotCourierLevel, path: readonly string[], nextNodeId: string): boolean {
  const currentNodeId = path.at(-1)
  if (!currentNodeId || path.includes(nextNodeId)) return false
  const targetId = getTarget(level)
  if (nextNodeId === targetId && !hasAllCheckpoints(level, path)) return false
  return buildAdjacency(level).get(currentNodeId)?.has(nextNodeId) ?? false
}

export function isComplete(level: RobotCourierLevel, path: readonly string[]): boolean {
  const startId = getStart(level)
  const targetId = getTarget(level)
  if (!startId || !targetId || path[0] !== startId || path.at(-1) !== targetId) return false
  if (new Set(path).size !== path.length || !hasAllCheckpoints(level, path)) return false
  return path.slice(0, -1).every((_, index) => {
    const nextNodeId = path[index + 1]
    return nextNodeId !== undefined && canMove(level, path.slice(0, index + 1), nextNodeId)
  })
}

function search(level: RobotCourierLevel, initialPath: readonly string[], limit: number): string[][] {
  const adjacency = buildAdjacency(level)
  const targetId = getTarget(level)
  const solutions: string[][] = []

  function visit(path: string[]): void {
    if (solutions.length >= limit) return
    const currentNodeId = path.at(-1)
    if (!currentNodeId) return
    const nextNodes = [...(adjacency.get(currentNodeId) ?? [])].sort()
    for (const nextNodeId of nextNodes) {
      if (path.includes(nextNodeId)) continue
      if (nextNodeId === targetId) {
        if (hasAllCheckpoints(level, path)) solutions.push([...path, nextNodeId])
        continue
      }
      visit([...path, nextNodeId])
      if (solutions.length >= limit) return
    }
  }

  visit([...initialPath])
  return solutions
}

export function findSolutions(level: RobotCourierLevel, limit = 2): string[][] {
  const startId = getStart(level)
  return startId ? search(level, [startId], limit) : []
}

export function findHint(level: RobotCourierLevel, path: readonly string[]): string | null {
  if (isComplete(level, path)) return null
  const solution = search(level, path, 1)[0]
  return solution?.[path.length] ?? null
}

export function validateLevel(level: RobotCourierLevel): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const nodeIds = new Set(level.nodes.map(node => node.id))
  for (const node of level.nodes) {
    if (ids.has(node.id)) errors.push(`duplicate node: ${node.id}`)
    ids.add(node.id)
  }
  if (level.nodes.filter(node => node.type === 'start').length !== 1) errors.push('level needs one start')
  if (level.nodes.filter(node => node.type === 'target').length !== 1) errors.push('level needs one target')
  if (!level.nodes.some(node => node.type === 'checkpoint')) errors.push('level needs a checkpoint')

  const edgeKeys = new Set<string>()
  for (const [from, to] of level.edges) {
    const key = edgeKey(from, to)
    if (!nodeIds.has(from) || !nodeIds.has(to)) errors.push(`unknown edge: ${from}-${to}`)
    if (from === to) errors.push(`self edge: ${from}`)
    if (edgeKeys.has(key)) errors.push(`duplicate edge: ${key}`)
    edgeKeys.add(key)
  }
  if (errors.length === 0 && findSolutions(level).length !== 1) errors.push('level must have exactly one solution')
  return errors
}
