import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import PoemPlaybackBar from '../components/poem/PoemPlaybackBar'
import PoemPageNavigation from '../components/poem/PoemPageNavigation'
import PasswordDialog from '../components/shared/PasswordDialog'
import { fetchPoem, hasAdminAccess } from '../lib/poems-api'
import { getPoemNavigationContext } from '../lib/poem-navigation'
import { checkTtsHealth, getTtsBaseUrl } from '../lib/tts'
import { usePoemLibrary } from '../hooks/usePoemLibrary'
import { usePoemTts } from '../hooks/usePoemTts'
import { useSettings } from '../hooks/useSettings'
import type { Poem } from '../types/poem'

export default function PoemReadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { poems } = usePoemLibrary()
  const [poem, setPoem] = useState<Poem | null>(null)
  const [loading, setLoading] = useState(true)
  const [ttsAvailable, setTtsAvailable] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const tts = usePoemTts(poem, settings)
  const { state, currentIndex, segments, play, pause, resume, stop, next, prev, replay, jumpTo, error } = tts
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const navigation = getPoemNavigationContext(poems, poem?.id ?? id)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPoem(id).then(p => {
      setPoem(p)
      setLoading(false)
    }).catch(() => {
      setPoem(null)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!settings.poemTtsEnabled) return
    const baseUrl = getTtsBaseUrl({
      poemTtsUseCustomService: settings.poemTtsUseCustomService,
      poemTtsServiceUrl: settings.poemTtsServiceUrl,
    })
    checkTtsHealth(baseUrl).then(setTtsAvailable)
  }, [settings.poemTtsEnabled, settings.poemTtsUseCustomService, settings.poemTtsServiceUrl])

  useEffect(() => {
    if (currentIndex < 0) return
    const seg = segments[currentIndex]
    if (!seg) return

    const el = lineRefs.current[currentIndex]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentIndex, segments])

  const handleSegmentClick = useCallback((segIndex: number) => {
    if (!settings.poemTtsEnabled || !ttsAvailable) return
    jumpTo(segIndex)
  }, [settings.poemTtsEnabled, ttsAvailable, jumpTo])

  const handleEditClick = () => {
    if (hasAdminAccess()) {
      navigate(`/poems/edit/${poem!.id}`)
      return
    }
    setShowPassword(true)
  }

  const handlePasswordSuccess = () => {
    setShowPassword(false)
    navigate(`/poems/edit/${poem!.id}`)
  }

  const handlePoemNavigate = useCallback((poemId: string) => {
    stop()
    navigate(`/poems/${poemId}`, { replace: true })
  }, [navigate, stop])

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center text-text-secondary py-12">加载中...</div>
      </PageContainer>
    )
  }

  if (!poem) {
    return (
      <PageContainer className="justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">古诗不存在</p>
          <button
            onClick={() => navigate('/poems', { replace: true })}
            className="px-6 py-3 rounded-xl bg-poem text-white font-semibold"
          >
            返回列表
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md pb-24">
        <div className="flex items-center gap-3 mb-2">
          <BackButton />
          <div className="flex-1" />
          <button
            onClick={handleEditClick}
            className="min-w-14 min-h-14 flex items-center justify-center rounded-xl bg-white/80 shadow-sm active:scale-95 transition-transform"
            aria-label="编辑"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center gap-5 py-8">
          {segments.map((seg, i) => {
            const isCurrent = i === currentIndex
            const isRead = currentIndex >= 0 && i < currentIndex
            const isUnread = currentIndex >= 0 && i > currentIndex

            let textClass = 'text-text'
            let sizeClass = 'text-2xl'
            let extraClass = ''

            if (seg.type === 'title') {
              sizeClass = 'text-3xl'
              textClass = isCurrent ? 'text-poem' : 'text-text'
            } else if (seg.type === 'meta') {
              sizeClass = 'text-base'
              textClass = isCurrent ? 'text-poem' : 'text-text-secondary'
            } else {
              textClass = isCurrent ? 'text-poem' : isRead ? 'text-text/40' : isUnread ? 'text-text' : 'text-text'
            }

            if (isCurrent) {
              extraClass = 'bg-poem-light/60 rounded-lg px-4 py-1.5 shadow-sm scale-105'
            }

            return (
              <div
                key={i}
                ref={el => { lineRefs.current[i] = el }}
                data-segment-index={i}
                onClick={() => handleSegmentClick(i)}
                className={`font-semibold leading-relaxed tracking-wider cursor-pointer select-text transition-all duration-300 ${sizeClass} ${textClass} ${extraClass}`}
              >
                {seg.text}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="text-center text-danger text-sm mb-4">
            {error}
          </div>
        )}

        {navigation && state === 'finished' ? (
          <div className="space-y-3">
            <div className="rounded-3xl border border-poem/15 bg-poem-light/40 px-4 py-4 text-center shadow-sm">
              <div className="text-sm font-medium text-text-secondary">本首已读完</div>
              <button
                type="button"
                onClick={play}
                className="mt-3 w-full rounded-2xl bg-poem px-4 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
              >
                再读一遍
              </button>
            </div>
            <PoemPageNavigation
              previous={navigation.previous}
              next={navigation.next}
              currentIndex={navigation.index}
              total={navigation.total}
              onNavigate={handlePoemNavigate}
            />
          </div>
        ) : navigation ? (
          <PoemPageNavigation
            previous={navigation.previous}
            next={navigation.next}
            currentIndex={navigation.index}
            total={navigation.total}
            onNavigate={handlePoemNavigate}
            compact
          />
        ) : null}
      </div>

      <PoemPlaybackBar
        state={state}
        currentIndex={currentIndex}
        segmentCount={segments.length}
        ttsEnabled={settings.poemTtsEnabled}
        ttsAvailable={ttsAvailable}
        onPlay={play}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onNext={next}
        onPrev={prev}
        onReplay={replay}
      />

      <PasswordDialog
        open={showPassword}
        onSuccess={handlePasswordSuccess}
        onCancel={() => setShowPassword(false)}
      />
    </PageContainer>
  )
}
