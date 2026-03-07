import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import PoemPlaybackBar from '../components/poem/PoemPlaybackBar'
import PasswordDialog, { hasAdminAccess } from '../components/shared/PasswordDialog'
import { fetchPoem } from '../lib/poems-api'
import { checkTtsHealth, getTtsBaseUrl } from '../lib/tts'
import { usePoemTts } from '../hooks/usePoemTts'
import { useSettings } from '../hooks/useSettings'
import type { Poem } from '../types/poem'

export default function PoemReadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [poem, setPoem] = useState<Poem | null>(null)
  const [loading, setLoading] = useState(true)
  const [ttsAvailable, setTtsAvailable] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const tts = usePoemTts(poem, settings)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  // 加载古诗
  useEffect(() => {
    if (!id) return
    fetchPoem(id).then(p => {
      setPoem(p)
      setLoading(false)
    }).catch(() => {
      setPoem(null)
      setLoading(false)
    })
  }, [id])

  // 检测 TTS 健康
  useEffect(() => {
    if (!settings.poemTtsEnabled) return
    const baseUrl = getTtsBaseUrl(settings)
    checkTtsHealth(baseUrl).then(setTtsAvailable)
  }, [settings.poemTtsEnabled, settings.poemTtsUseCustomService, settings.poemTtsServiceUrl])

  // 自动滚动到当前高亮行
  useEffect(() => {
    if (tts.currentIndex < 0) return
    // segments 中前面可能有 title/meta，需要映射到正文行索引
    const seg = tts.segments[tts.currentIndex]
    if (!seg) return

    // 找到对应的 DOM 元素
    const el = document.querySelector(`[data-segment-index="${tts.currentIndex}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [tts.currentIndex, tts.segments])

  const handleSegmentClick = useCallback((segIndex: number) => {
    if (!settings.poemTtsEnabled || !ttsAvailable) return
    tts.jumpTo(segIndex)
  }, [settings.poemTtsEnabled, ttsAvailable, tts.jumpTo])

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
        {/* 顶部栏 */}
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

        {/* 段落展示区 */}
        <div className="flex flex-col items-center gap-5 py-8">
          {tts.segments.map((seg, i) => {
            const isCurrent = i === tts.currentIndex
            const isRead = tts.currentIndex >= 0 && i < tts.currentIndex
            const isUnread = tts.currentIndex >= 0 && i > tts.currentIndex

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

        {/* 错误提示 */}
        {tts.error && (
          <div className="text-center text-danger text-sm mb-4">
            {tts.error}
          </div>
        )}
      </div>

      {/* 播放控制栏 */}
      <PoemPlaybackBar
        state={tts.state}
        currentIndex={tts.currentIndex}
        segmentCount={tts.segments.length}
        ttsEnabled={settings.poemTtsEnabled}
        ttsAvailable={ttsAvailable}
        onPlay={tts.play}
        onPause={tts.pause}
        onResume={tts.resume}
        onStop={tts.stop}
        onNext={tts.next}
        onPrev={tts.prev}
        onReplay={tts.replay}
      />

      <PasswordDialog
        open={showPassword}
        onSuccess={handlePasswordSuccess}
        onCancel={() => setShowPassword(false)}
      />
    </PageContainer>
  )
}
