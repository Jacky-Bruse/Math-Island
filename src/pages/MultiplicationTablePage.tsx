import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BackButton from '../components/shared/BackButton'
import PageContainer from '../components/layout/PageContainer'
import { useSettings } from '../hooks/useSettings'
import { useMultiplicationPlayback } from '../hooks/useMultiplicationPlayback'
import {
  formatMultiplicationEquation,
  getMultiplicationFacts,
  getMultiplicationFactsByGroup,
} from '../lib/multiplication'
import type { MultiplicationFact, MultiplicationGroup } from '../types/multiplication'

const CONTEXT_KEY = 'math-island:multiplication-context'
const groups = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

function factKey(fact: Pick<MultiplicationFact, 'a' | 'b'>) {
  return `${fact.a}x${fact.b}`
}

function getGroupFromFactKey(key: string | null): MultiplicationGroup | null {
  if (!key) return null

  const group = Number(key.split('x')[1])
  if (!Number.isInteger(group) || group < 1 || group > 9) {
    return null
  }

  return group as MultiplicationGroup
}

export default function MultiplicationTablePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { settings } = useSettings()
  const playback = useMultiplicationPlayback(settings)
  const { currentFact, error, pause, queue, replay, resume, start, state, stop } = playback
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [restored, setRestored] = useState(false)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const allFacts = useMemo(() => getMultiplicationFacts(), [])

  useEffect(() => {
    if (restored) return

    try {
      const raw = sessionStorage.getItem(CONTEXT_KEY)
      if (!raw) {
        setRestored(true)
        return
      }

      const parsed = JSON.parse(raw) as { scrollY?: number; selectedKey?: string }
      if (parsed.selectedKey) {
        setSelectedKey(parsed.selectedKey)
      }

      requestAnimationFrame(() => {
        if (typeof parsed.scrollY === 'number') {
          window.scrollTo({ top: parsed.scrollY })
        }
      })
    } catch {
      // ignore broken restore payload
    } finally {
      setRestored(true)
    }
  }, [restored])

  useEffect(() => {
    if (!currentFact) return
    const element = cellRefs.current[factKey(currentFact)]
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentFact])

  useEffect(() => {
    return () => stop()
  }, [stop])

  useEffect(() => {
    const state = location.state as { selectedKey?: string } | null
    if (state?.selectedKey) {
      setSelectedKey(state.selectedKey)
    }
  }, [location.state])

  const activeKey = currentFact ? factKey(currentFact) : selectedKey
  const activeGroup = currentFact?.b ?? getGroupFromFactKey(selectedKey)

  const registerCell = useCallback((key: string, element: HTMLButtonElement | null) => {
    cellRefs.current[key] = element
  }, [])

  const handlePlayGroup = useCallback((targetGroup: MultiplicationGroup) => {
    start(getMultiplicationFactsByGroup(targetGroup), 'group-read', `${targetGroup}这一组`)
  }, [start])

  const handleOpenUnderstand = useCallback((fact: MultiplicationFact) => {
    const nextKey = factKey(fact)
    setSelectedKey(nextKey)
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({
      scrollY: window.scrollY,
      selectedKey: nextKey,
    }))
    stop()
    navigate(`/arithmetic/multiplication/understand/${fact.a}/${fact.b}`, {
      state: { selectedKey: nextKey },
    })
  }, [navigate, stop])

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,#fff8ef_0%,#fff1e8_32%,#fffdfb_100%)]">
      <div className="w-full max-w-5xl">
        <div
          data-testid="multiplication-table-locked-shell"
          className="sticky top-0 z-20 bg-[radial-gradient(circle_at_top,#fff8ef_0%,#fff1e8_32%,#fffdfb_100%)]"
        >
          <div className="flex items-center gap-3 mb-5">
            <BackButton />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#9a3412]">九九乘法口诀</h1>
              <p className="text-sm text-[#9a3412]/70">点任意算式看苹果演示，按整组读，或从头完整跟读</p>
            </div>
          </div>

          <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(255,239,229,0.92))] px-5 py-5 shadow-[0_28px_60px_rgba(249,115,22,0.14)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="max-w-xl text-sm leading-6 text-text-secondary">
                  完整朗读会按口诀表顺序从头读到尾，完整跟读会在每句中间停顿，整组朗读只读当前这一组。
                </p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
                <button
                  type="button"
                  onClick={() => start(allFacts, 'full-read', '完整朗读')}
                  className="min-h-14 rounded-2xl bg-[#ea580c] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(234,88,12,0.26)] active:scale-[0.98] transition-transform"
                >
                  完整朗读
                </button>
                <button
                  type="button"
                  onClick={() => start(allFacts, 'full-follow', '完整跟读')}
                  className="min-h-14 rounded-2xl bg-[#fb923c] px-5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(251,146,60,0.28)] active:scale-[0.98] transition-transform"
                >
                  完整跟读
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stop()
                    navigate('/arithmetic/multiplication/practice')
                  }}
                  className="min-h-14 rounded-2xl border border-[#fdba74] bg-white px-5 text-sm font-bold text-[#c2410c] active:scale-[0.98] transition-transform"
                >
                  口诀练习
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#fed7aa] bg-white/80 px-4 py-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#c2410c]/70">Now Playing</div>
                  <div className="mt-1 text-xl font-black text-[#9a3412]">
                    {currentFact ? formatMultiplicationEquation(currentFact) : '选择整张表朗读、跟读，或点某一组朗读'}
                  </div>
                  <div className="mt-1 text-sm text-text-secondary">
                    {currentFact?.chant ?? queue?.label ?? '点任意算式会进入独立演示界面'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {state === 'playing' ? (
                    <button
                      type="button"
                      onClick={pause}
                      className="min-h-11 rounded-xl bg-[#fff7ed] px-4 text-sm font-semibold text-[#c2410c] active:scale-95 transition-transform"
                    >
                      暂停
                    </button>
                  ) : state === 'paused' ? (
                    <button
                      type="button"
                      onClick={resume}
                      className="min-h-11 rounded-xl bg-[#ea580c] px-4 text-sm font-semibold text-white active:scale-95 transition-transform"
                    >
                      继续
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={replay}
                    disabled={!queue}
                    className="min-h-11 rounded-xl bg-[#fff7ed] px-4 text-sm font-semibold text-[#c2410c] active:scale-95 transition-transform disabled:opacity-40"
                  >
                    重读当前
                  </button>
                  <button
                    type="button"
                    onClick={stop}
                    disabled={state === 'idle'}
                    className="min-h-11 rounded-xl bg-[#fef2f2] px-4 text-sm font-semibold text-danger active:scale-95 transition-transform disabled:opacity-40"
                  >
                    停止
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-xl bg-danger-light/20 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 space-y-4">
          {groups.map(group => (
            <GroupRow
              key={group}
              group={group}
              activeKey={activeGroup === group ? activeKey : null}
              onPlayGroup={handlePlayGroup}
              onOpenUnderstand={handleOpenUnderstand}
              registerCell={registerCell}
            />
          ))}
        </section>
      </div>
    </PageContainer>
  )
}

const GroupRow = memo(function GroupRow({
  group,
  activeKey,
  onPlayGroup,
  onOpenUnderstand,
  registerCell,
}: {
  group: MultiplicationGroup
  activeKey: string | null
  onPlayGroup: (group: MultiplicationGroup) => void
  onOpenUnderstand: (fact: MultiplicationFact) => void
  registerCell: (key: string, element: HTMLButtonElement | null) => void
}) {
  const facts = getMultiplicationFactsByGroup(group)

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_18px_36px_rgba(249,115,22,0.08)] backdrop-blur-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.26em] text-[#fb923c]">Group {group}</div>
          <h3 className="mt-1 text-xl font-black text-text">{group} 这一组</h3>
          <p className="text-sm text-text-secondary">顺序从 1×{group} 读到 {group}×{group}</p>
        </div>
        <button
          type="button"
          onClick={() => onPlayGroup(group)}
          className="min-h-12 rounded-2xl bg-[#fff3e6] px-4 text-sm font-bold text-[#c2410c] active:scale-[0.98] transition-transform"
        >
          朗读这一组
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {facts.map(fact => {
          const key = factKey(fact)
          const active = key === activeKey

          return (
            <button
              key={key}
              ref={element => {
                registerCell(key, element)
              }}
              type="button"
              onClick={() => onOpenUnderstand(fact)}
              className={`group rounded-[1.5rem] border px-4 py-4 text-left transition-all duration-300 active:scale-[0.98] ${
                active
                  ? 'border-[#fb923c] bg-[linear-gradient(145deg,#fff1e7,#ffffff)] shadow-[0_16px_30px_rgba(251,146,60,0.18)]'
                  : 'border-[#ffedd5] bg-[#fffdfb] hover:border-[#fdba74]'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#c2410c]/60">
                Group {group}
              </div>
              <div className="mt-2 text-[clamp(1.9rem,4vw,2.7rem)] font-black tracking-tight text-[#7c2d12]">
                {formatMultiplicationEquation(fact)}
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                点击查看 {fact.meaningText} 的苹果演示
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
