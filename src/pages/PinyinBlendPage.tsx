import { useCallback } from 'react'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import BlendBuilder from '../components/pinyin/BlendBuilder'
import { useSettings } from '../hooks/useSettings'
import { usePinyinAudio } from '../hooks/usePinyinAudio'
import { usePinyinProgress } from '../hooks/usePinyinProgress'

export default function PinyinBlendPage() {
  const { settings } = useSettings()
  const { playBlend, preloadBlend } = usePinyinAudio(settings.sound)
  const { markLearned } = usePinyinProgress()

  const handleBlended = useCallback((audioKey: string) => {
    markLearned(`blend:${audioKey}`)
  }, [markLearned])

  return (
    <PageContainer>
      <div className="w-full max-w-3xl pb-4">
        <div className="flex items-center gap-3 mb-5">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-text">拼读</h1>
        </div>

        <BlendBuilder onPlay={playBlend} onBlended={handleBlended} onPreload={preloadBlend} />
      </div>
    </PageContainer>
  )
}
