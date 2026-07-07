import { useEffect, useRef } from 'react'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import StarReward from '../components/shared/StarReward'
import OptionGrid from '../components/pinyin/OptionGrid'
import { useSettings } from '../hooks/useSettings'
import { useSound } from '../hooks/useSound'
import { usePinyinAudio } from '../hooks/usePinyinAudio'
import { usePinyinPractice } from '../hooks/usePinyinPractice'
import { usePinyinProgress } from '../hooks/usePinyinProgress'

export default function PinyinCharactersPage() {
  const { settings } = useSettings()
  const { play: playCue } = useSound(!settings.sound)
  const { playHanzi } = usePinyinAudio(settings.sound)
  const { recordCharacterCorrect } = usePinyinProgress()
  const { state, pickOption } = usePinyinPractice()

  const { question, status, wrongPicks, completedCount, correctCount } = state
  const { kind, target, options } = question

  // 听音选字：新题自动播放目标单字音
  const lastPlayedRef = useRef<string>('')
  useEffect(() => {
    if (kind === 'hear-char') {
      const tag = `${target.hanzi}:${completedCount}`
      if (lastPlayedRef.current !== tag) {
        lastPlayedRef.current = tag
        playHanzi(target.hanzi)
      }
    }
  }, [kind, target.hanzi, completedCount, playHanzi])

  const handlePick = (hanzi: string) => {
    const result = pickOption(hanzi)
    if (result.correct) {
      playCue('correct')
      recordCharacterCorrect(target.hanzi)
    } else {
      playCue('wrong')
    }
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-text">汉字练习</h1>
          <span className="ml-auto text-sm text-text-secondary">答对 {correctCount} / {completedCount}</span>
        </div>

        {/* 题面 */}
        <div className="rounded-2xl bg-pinyin-light border border-pinyin/20 p-6 mb-5 flex flex-col items-center">
          {kind === 'hear-char' ? (
            <>
              <p className="text-sm text-text-secondary mb-3">听一听，选出听到的字</p>
              <button
                onClick={() => playHanzi(target.hanzi)}
                className="text-base px-6 py-3 rounded-full bg-pinyin text-white font-bold active:scale-95 transition-transform"
              >
                ▶ 再播放一次
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-2">选出这个拼音对应的字</p>
              <div className="text-5xl font-extrabold text-pinyin">{target.pinyin}</div>
            </>
          )}
        </div>

        <OptionGrid
          options={options}
          targetHanzi={target.hanzi}
          status={status}
          wrongPicks={wrongPicks}
          onPick={handlePick}
        />

        {status === 'revealed' && (
          <p className="text-center text-sm text-text-secondary mt-4">
            正确答案是 <span className="text-success font-bold">{target.hanzi}</span>（{target.pinyin}）
          </p>
        )}
      </div>

      <StarReward visible={status === 'correct'} />
    </PageContainer>
  )
}
