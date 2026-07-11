import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/shared/BackButton'
import PageContainer from '../components/layout/PageContainer'
import { useSettings } from '../hooks/useSettings'
import { useSound } from '../hooks/useSound'
import { clientPointToViewBox, findHint, isComplete, canMove } from '../lib/robot-courier'
import { levels } from '../lib/robot-courier-levels'
import { loadRobotCourierProgress, saveRobotCourierProgress } from '../lib/storage'
import type { RobotCourierLevel, RobotCourierNode, RobotCourierProgress } from '../types/robot-courier'

type Phase = 'planning' | 'completed'

function startOf(level: RobotCourierLevel): string {
  return level.nodes.find(node => node.type === 'start')?.id ?? 'start'
}

function nodeMap(level: RobotCourierLevel): Map<string, RobotCourierNode> {
  return new Map(level.nodes.map(node => [node.id, node]))
}

function edgeKey(from: string, to: string): string {
  return [from, to].sort().join('|')
}

export default function RobotCourierPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { play } = useSound(!settings.sound)
  const [progress, setProgress] = useState(loadRobotCourierProgress)
  const [currentLevelId, setCurrentLevelId] = useState(progress.unlockedLevel)
  const [path, setPath] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('planning')
  const [hintNodeId, setHintNodeId] = useState<string | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [hintActive, setHintActive] = useState(false)
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const suppressClick = useRef(false)

  const level = levels[currentLevelId - 1] ?? levels[0]
  const currentPath = path.length > 0 ? path : [startOf(level)]
  const nodes = useMemo(() => nodeMap(level), [level])
  const visited = new Set(currentPath)
  const currentNode = nodes.get(currentPath.at(-1) ?? '')

  const resetLevel = (levelId = currentLevelId) => {
    const nextLevel = levels[levelId - 1] ?? levels[0]
    setCurrentLevelId(levelId)
    setPath([startOf(nextLevel)])
    setPhase('planning')
    setHintNodeId(null)
    setHintCount(0)
    setHintActive(false)
    setErrorNodeId(null)
    setFeedback(null)
    setHoverNodeId(null)
    setDragging(false)
  }

  const completeLevel = (nextPath: string[]) => {
    const stars: 1 | 2 | 3 = hintCount === 0 ? 3 : hintCount === 1 ? 2 : 1
    const previousStars = progress.bestStars[currentLevelId] ?? 0
    const bestStars = { ...progress.bestStars }
    if (stars > previousStars) bestStars[currentLevelId] = stars
    const nextProgress: RobotCourierProgress = {
      version: 1 as const,
      unlockedLevel: Math.min(levels.length, Math.max(progress.unlockedLevel, currentLevelId + 1)),
      bestStars,
    }
    setProgress(nextProgress)
    saveRobotCourierProgress(nextProgress)
    setPath(nextPath)
    setPhase('completed')
    setFeedback('配送成功！')
    play('complete')
  }

  const rejectMove = (message: string, nodeId: string) => {
    setFeedback(message)
    setHintNodeId(null)
    setHintActive(false)
    setErrorNodeId(nodeId)
    play('wrong')
    window.setTimeout(() => setFeedback(current => current === message ? null : current), 700)
    window.setTimeout(() => setErrorNodeId(current => current === nodeId ? null : current), 700)
  }

  const moveTo = (nextNodeId: string) => {
    if (phase === 'completed' || nextNodeId === currentPath.at(-1)) return
    if (!canMove(level, currentPath, nextNodeId)) {
      const next = nodes.get(nextNodeId)
      rejectMove(next?.type === 'target' ? '还有能量晶体没有收集' : '这条航线走不通，试试其他路线', nextNodeId)
      return
    }
    const nextPath = [...currentPath, nextNodeId]
    setPath(nextPath)
    setHintNodeId(null)
    setHintActive(false)
    setErrorNodeId(null)
    setFeedback(null)
    play('click')
    if (isComplete(level, nextPath)) completeLevel(nextPath)
  }

  const handleHint = () => {
    if (phase === 'completed' || hintActive) return
    const nextNodeId = findHint(level, currentPath)
    setHintCount(count => count + 1)
    setHintNodeId(nextNodeId)
    setHintActive(true)
    setErrorNodeId(null)
    setFeedback(nextNodeId ? '看看发光的航线' : '退一步再试试')
    play('hint')
  }

  const handleUndo = () => {
    if (phase === 'completed' || currentPath.length <= 1) return
    setPath(currentPath.slice(0, -1))
    setHintNodeId(null)
    setHintActive(false)
    setErrorNodeId(null)
    setFeedback(null)
  }

  const pointFromEvent = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    const rect = svg?.getBoundingClientRect()
    if (!svg || !rect) return null
    return clientPointToViewBox(event.clientX, event.clientY, rect)
  }

  const nearestMovableNode = (event: PointerEvent<SVGSVGElement>): string | null => {
    const point = pointFromEvent(event)
    if (!point) return null
    let nearest: { id: string; distance: number } | null = null
    for (const node of level.nodes) {
      if (visited.has(node.id) || node.id === currentPath.at(-1)) continue
      const distance = Math.hypot(node.x - point.x, node.y - point.y)
      if (distance <= 9 && (!nearest || distance < nearest.distance) && canMove(level, currentPath, node.id)) {
        nearest = { id: node.id, distance }
      }
    }
    return nearest?.id ?? null
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (phase === 'completed') return
    const nodeId = (event.target as SVGElement).closest('[data-node-id]')?.getAttribute('data-node-id')
    if (nodeId !== currentPath.at(-1)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    suppressClick.current = false
    setDragging(true)
    setHoverNodeId(null)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const nextNodeId = nearestMovableNode(event)
    setHoverNodeId(nextNodeId)
    suppressClick.current = suppressClick.current || nextNodeId !== null
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const nextNodeId = hoverNodeId
    setDragging(false)
    setHoverNodeId(null)
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId)
    if (nextNodeId) {
      suppressClick.current = true
      moveTo(nextNodeId)
    }
  }

  const handleNodeClick = (nodeId: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    moveTo(nodeId)
  }

  const handleNodeKeyDown = (event: KeyboardEvent<SVGGElement>, nodeId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      moveTo(nodeId)
    }
  }

  const pathPoints = currentPath.map(nodeId => nodes.get(nodeId)).filter((node): node is RobotCourierNode => node !== undefined)
  const pathPointString = pathPoints.map(node => `${node.x},${node.y}`).join(' ')
  const currentPoint = currentNode
  const hoverPoint = hoverNodeId ? nodes.get(hoverNodeId) : undefined
  const hintTarget = hintNodeId ? nodes.get(hintNodeId) : undefined
  return (
    <PageContainer className="items-stretch bg-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <button className="text-left text-lg font-bold text-text" onClick={() => setPickerOpen(true)}>
                第 {currentLevelId} 关
              </button>
              <p className="text-xs text-text-secondary">机器人快递员</p>
            </div>
          </div>
          <div className="rounded-full bg-secondary-light px-3 py-2 text-sm font-bold text-text">
            {Array.from({ length: 3 }, (_, index) => index < (progress.bestStars[currentLevelId] ?? 0) ? '⭐' : '☆').join('')}
          </div>
        </header>

        <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-sm">
          <span className="text-sm font-semibold text-text">能量晶体：{currentPath.filter(id => nodes.get(id)?.type === 'checkpoint').length}/{level.nodes.filter(node => node.type === 'checkpoint').length}</span>
          <span className={`min-h-5 text-sm ${feedback ? 'font-semibold text-secondary' : 'text-text-secondary'}`} aria-live="polite">{feedback}</span>
        </div>

        <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 p-2 shadow-lg">
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="h-[min(68dvh,42rem)] w-full select-none touch-none"
            role="application"
            aria-label="机器人快递路线地图"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <defs>
              <radialGradient id="robot-courier-bg" cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#243b68" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" rx="5" fill="url(#robot-courier-bg)" />
            {level.edges.map(([from, to]) => {
              const a = nodes.get(from)
              const b = nodes.get(to)
              if (!a || !b) return null
              return <line key={edgeKey(from, to)} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
            })}
            {hintActive && currentPoint && hintTarget && <line x1={currentPoint.x} y1={currentPoint.y} x2={hintTarget.x} y2={hintTarget.y} stroke="#fde047" strokeWidth="3.6" strokeLinecap="round" className="motion-safe:animate-pulse" />}
            {pathPointString && <polyline points={pathPointString} fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
            {dragging && currentPoint && hoverPoint && <line x1={currentPoint.x} y1={currentPoint.y} x2={hoverPoint.x} y2={hoverPoint.y} stroke="#fde68a" strokeWidth="2.4" strokeDasharray="3 2" />}
            {level.nodes.map(node => {
              const isCurrent = node.id === currentPath.at(-1)
              const isVisited = visited.has(node.id)
              const isHint = node.id === hintNodeId
              const isError = errorNodeId === node.id
              const fill = node.type === 'start' ? '#38bdf8' : node.type === 'target' ? '#fb7185' : isVisited ? '#fbbf24' : '#f8fafc'
              return (
                <g
                  key={node.id}
                  data-node-id={node.id}
                  role="button"
                  tabIndex={phase === 'completed' ? -1 : 0}
                  aria-label={node.type === 'start' ? '机器人起点' : node.type === 'target' ? '快递终点' : `能量晶体 ${node.id}`}
                  onClick={() => handleNodeClick(node.id)}
                  onKeyDown={event => handleNodeKeyDown(event, node.id)}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={node.x} cy={node.y} r={isCurrent || isHint ? 6.5 : 5.5} fill={isHint ? '#fde047' : fill} opacity={isVisited || isCurrent || isHint ? 1 : 0.9} stroke={isError ? '#ef4444' : isCurrent ? '#fff' : '#0f172a'} strokeWidth={isError || isCurrent ? 1.5 : 0.8} />
                  <text x={node.x} y={node.y + 1.5} textAnchor="middle" fontSize="4.2" aria-hidden="true">{node.type === 'start' ? '🚀' : node.type === 'target' ? '📦' : '★'}</text>
                </g>
              )
            })}
            {currentPoint && <text data-node-id={currentPath.at(-1)} x={currentPoint.x} y={currentPoint.y - 7} textAnchor="middle" fontSize="6" className="cursor-grab" aria-hidden="true">🤖</text>}
          </svg>
        </main>

        <div className="flex flex-wrap justify-center gap-3">
          <button className="min-h-14 rounded-2xl bg-surface px-5 font-bold text-text shadow-sm disabled:opacity-40" onClick={handleUndo} disabled={phase === 'completed' || currentPath.length <= 1}>撤销</button>
          <button className="min-h-14 rounded-2xl bg-surface px-5 font-bold text-text shadow-sm" onClick={() => resetLevel()}>重新开始</button>
          <button className="min-h-14 rounded-2xl bg-secondary px-5 font-bold text-white shadow-sm disabled:opacity-40" onClick={handleHint} disabled={phase === 'completed' || hintActive}>提示</button>
        </div>
      </div>

      {phase === 'completed' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="animate-fade-in motion-reduce:animate-none w-full max-w-sm rounded-3xl bg-surface p-7 text-center shadow-2xl">
            <div className="mb-2 animate-bounce motion-reduce:animate-none text-5xl">🎉</div>
            <h2 className="text-2xl font-extrabold text-text">配送成功！</h2>
            <p className="mt-2 text-text-secondary">第 {currentLevelId} 关完成</p>
            <div className="my-5 text-3xl">{Array.from({ length: 3 }, (_, index) => index < (hintCount === 0 ? 3 : hintCount === 1 ? 2 : 1) ? '⭐' : '☆').join('')}</div>
            <div className="flex gap-3">
              <button className="min-h-14 flex-1 rounded-2xl bg-surface-muted font-bold text-text" onClick={() => resetLevel()}>重玩</button>
              {currentLevelId < levels.length ? <button className="min-h-14 flex-1 rounded-2xl bg-primary font-bold text-white" onClick={() => resetLevel(currentLevelId + 1)}>下一关</button> : <button className="min-h-14 flex-1 rounded-2xl bg-primary font-bold text-white" onClick={() => navigate('/games')}>返回游戏</button>}
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" onClick={() => setPickerOpen(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-surface p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-text">选择关卡</h2><button className="min-h-12 min-w-12 rounded-xl bg-surface-muted text-xl" onClick={() => setPickerOpen(false)} aria-label="关闭">×</button></div>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {levels.map(item => {
                const unlocked = item.id <= progress.unlockedLevel
                return <button key={item.id} disabled={!unlocked} onClick={() => { resetLevel(item.id); setPickerOpen(false) }} className="min-h-16 rounded-2xl bg-surface-muted p-2 text-center font-bold text-text disabled:opacity-35"><span className="block">{unlocked ? item.id : '🔒'}</span><span className="text-xs text-secondary">{Array.from({ length: progress.bestStars[item.id] ?? 0 }, () => '★').join('')}</span></button>
              })}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
