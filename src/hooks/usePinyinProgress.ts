import { useCallback, useState } from 'react'
import { loadPinyinProgress, savePinyinProgress } from '../lib/storage'
import type { PinyinProgress } from '../types/pinyin'

// 拼音学习进度：Record 去重存储，记录但不锁关卡。
export function usePinyinProgress() {
  const [progress, setProgress] = useState<PinyinProgress>(loadPinyinProgress)

  // 标记某字母/音节“学过”（首次点读时写入时间戳，重复点击不重复计数）
  const markLearned = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.learned[id]) return prev
      const next: PinyinProgress = {
        ...prev,
        learned: { ...prev.learned, [id]: Date.now() },
      }
      savePinyinProgress(next)
      return next
    })
  }, [])

  // 认读练习答对计数（仅答对累加）
  const recordCharacterCorrect = useCallback((hanzi: string) => {
    setProgress(prev => {
      const next: PinyinProgress = {
        ...prev,
        characterCorrect: {
          ...prev.characterCorrect,
          [hanzi]: (prev.characterCorrect[hanzi] ?? 0) + 1,
        },
      }
      savePinyinProgress(next)
      return next
    })
  }, [])

  const isLearned = useCallback((id: string) => !!progress.learned[id], [progress.learned])

  return { progress, markLearned, recordCharacterCorrect, isLearned }
}
