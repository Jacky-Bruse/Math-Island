import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import AppleToken from '../components/multiplication/AppleToken'
import {
  getMultiplicationDemoMode,
  getMultiplicationFact,
  getMultiplicationNavigation,
} from '../lib/multiplication'

const CONTEXT_KEY = 'math-island:multiplication-context'

export default function MultiplicationUnderstandPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ a: string; b: string }>()
  const a = Number(params.a)
  const b = Number(params.b)
  const [stage, setStage] = useState(0)
  const [highlightedGroups, setHighlightedGroups] = useState(0)
  const [runId, setRunId] = useState(0)
  const [expandedNumbers, setExpandedNumbers] = useState(false)

  const fact = useMemo(() => {
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || a > 9 || b < 1 || b > 9 || a > b) {
      return null
    }
    return getMultiplicationFact(a, b as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)
  }, [a, b])

  const navigation = useMemo(() => {
    if (!fact) return null
    return getMultiplicationNavigation(fact.a, fact.b)
  }, [fact])

  const demoMode = fact ? getMultiplicationDemoMode(fact.answer) : 'all-numbered'
  const effectiveMode = expandedNumbers && demoMode === 'grouped' ? 'compact-numbered' : demoMode

  useEffect(() => {
    if (!fact) return

    setStage(0)
    setHighlightedGroups(0)

    const stageOne = window.setTimeout(() => setStage(1), 600)
    const stageTwo = window.setTimeout(() => setStage(2), 1400)
    const stageThree = window.setTimeout(() => setStage(3), 2500)

    return () => {
      window.clearTimeout(stageOne)
      window.clearTimeout(stageTwo)
      window.clearTimeout(stageThree)
    }
  }, [fact, runId])

  useEffect(() => {
    if (!fact || stage < 2) return

    if (effectiveMode === 'grouped') {
      let nextGroup = 0
      const timer = window.setInterval(() => {
        nextGroup += 1
        setHighlightedGroups(nextGroup)
        if (nextGroup >= fact.groups) {
          window.clearInterval(timer)
        }
      }, 280)

      return () => window.clearInterval(timer)
    }

    setHighlightedGroups(fact.groups)
  }, [effectiveMode, fact, stage])

  if (!fact || !navigation) {
    return (
      <PageContainer className="justify-center">
        <div className="rounded-3xl bg-white px-6 py-8 text-center shadow-md">
          <p className="text-text-secondary">没有找到这句口诀。</p>
          <button
            type="button"
            onClick={() => navigate('/arithmetic/multiplication')}
            className="mt-4 min-h-12 rounded-xl bg-[#ea580c] px-5 font-semibold text-white"
          >
            回到口诀表
          </button>
        </div>
      </PageContainer>
    )
  }

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/arithmetic/multiplication', {
      state: location.state,
    })
  }

  const openNeighbor = (direction: 'previous' | 'next') => {
    const target = navigation[direction]
    if (!target) return

    let scrollY = 0
    try {
      const raw = sessionStorage.getItem(CONTEXT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { scrollY?: number }
        scrollY = typeof parsed.scrollY === 'number' ? parsed.scrollY : 0
      }
    } catch {
      scrollY = 0
    }

    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({
      scrollY,
      selectedKey: `${target.a}x${target.b}`,
    }))

    navigate(`/arithmetic/multiplication/understand/${target.a}/${target.b}`, {
      replace: true,
      state: { selectedKey: `${target.a}x${target.b}` },
    })
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,#fffaf0_0%,#fff6ec_34%,#fffdfb_100%)]">
      <div className="w-full max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="min-w-14 min-h-14 rounded-2xl bg-white/85 shadow-sm active:scale-95 transition-transform"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex-1 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#c2410c]/70">Understand</div>
            <h1 className="mt-1 text-3xl font-black text-[#7c2d12]">{fact.a} × {fact.b}</h1>
            <p className="mt-1 text-sm text-text-secondary">{fact.meaningText}，一共 {fact.answer} 个</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openNeighbor('previous')}
              disabled={!navigation.previous}
              className="min-w-12 min-h-12 rounded-2xl bg-white/85 shadow-sm active:scale-95 transition-transform disabled:opacity-35"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => openNeighbor('next')}
              disabled={!navigation.next}
              className="min-w-12 min-h-12 rounded-2xl bg-white/85 shadow-sm active:scale-95 transition-transform disabled:opacity-35"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(255,243,230,0.92))] px-5 py-5 shadow-[0_28px_60px_rgba(249,115,22,0.16)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#fb923c]">Apple Demo</div>
              <h2 className="mt-2 text-2xl font-black text-text">把这句口诀变成能看见的苹果分组</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                先看几组、每组几个，再看一共多少个，最后把它收束回口诀本身。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRunId(value => value + 1)}
                className="min-h-12 rounded-2xl bg-[#ea580c] px-4 text-sm font-bold text-white active:scale-95 transition-transform"
              >
                再看一遍
              </button>
              {demoMode === 'grouped' && (
                <button
                  type="button"
                  onClick={() => setExpandedNumbers(value => !value)}
                  className="min-h-12 rounded-2xl border border-[#fdba74] bg-white px-4 text-sm font-bold text-[#c2410c] active:scale-95 transition-transform"
                >
                  {expandedNumbers ? '收起全部编号' : '展开全部编号'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-[#ffedd5] bg-white/75 px-4 py-5">
            <div className="multiplication-group-board">
              {Array.from({ length: fact.groups }, (_, groupIndex) => {
                const groupNumber = groupIndex + 1
                const isHighlighted = highlightedGroups >= groupNumber
                const cumulativeTotal = groupNumber * fact.itemsPerGroup

                return (
                  <div
                    key={groupNumber}
                    className={`rounded-[1.5rem] border px-3 py-3 transition-all duration-500 ${
                      isHighlighted
                        ? 'border-[#fdba74] bg-[linear-gradient(145deg,#fff4eb,#fffdfa)] shadow-[0_12px_28px_rgba(251,146,60,0.16)]'
                        : 'border-[#ffedd5] bg-[#fffaf5]'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-[#9a3412]">第 {groupNumber} 组</div>
                      {(effectiveMode === 'grouped' || highlightedGroups >= groupNumber) && stage >= 2 && (
                        <div className={`rounded-full px-3 py-1 text-xs font-bold ${isHighlighted ? 'bg-[#ea580c] text-white' : 'bg-[#ffedd5] text-[#c2410c]'}`}>
                          {isHighlighted ? cumulativeTotal : `${fact.itemsPerGroup}`}
                        </div>
                      )}
                    </div>

                    <div
                      className="grid justify-center gap-2"
                      style={{ gridTemplateColumns: `repeat(${Math.min(3, fact.itemsPerGroup)}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: fact.itemsPerGroup }, (_, itemIndex) => {
                        const number = groupIndex * fact.itemsPerGroup + itemIndex + 1
                        const showNumber = stage >= 2 && (effectiveMode !== 'grouped' || expandedNumbers)

                        return (
                          <div key={number} className="flex justify-center">
                            <AppleToken
                              number={number}
                              compact={effectiveMode !== 'all-numbered'}
                              highlighted={isHighlighted}
                              showNumber={showNumber}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <StepCard active={stage >= 1} title="先看分组" value={`${fact.groups}组，每组${fact.itemsPerGroup}个`} />
            <StepCard active={stage >= 2} title="再看累计" value={`${fact.meaningText} = ${fact.answer}`} />
            <StepCard active={stage >= 3} title="最后回到口诀" value={fact.chant} />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

function StepCard({ active, title, value }: { active: boolean; title: string; value: string }) {
  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 transition-all duration-500 ${
      active
        ? 'border-[#fdba74] bg-white shadow-[0_12px_24px_rgba(251,146,60,0.14)]'
        : 'border-[#ffedd5] bg-[#fff8f2] opacity-70'
    }`}
    >
      <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#c2410c]/65">{title}</div>
      <div className="mt-2 text-xl font-black text-[#7c2d12]">{value}</div>
    </div>
  )
}
