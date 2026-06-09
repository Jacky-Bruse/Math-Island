import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import { usePinyinProgress } from '../hooks/usePinyinProgress'
import { LETTER_SEQUENCE, letterEntryId } from '../lib/pinyin-data'

const stages = [
  { key: 'letters', title: '认字母', desc: '声母 · 韵母 · 四声，点读跟读', path: '/pinyin/letters', icon: '🔤' },
  { key: 'blend', title: '拼读', desc: '声母 + 韵母 + 声调，拼出音节', path: '/pinyin/blend', icon: '🧩' },
  { key: 'characters', title: '汉字联系', desc: '听音认字、看拼音认字', path: '/pinyin/characters', icon: '📖' },
] as const

export default function PinyinHomePage() {
  const navigate = useNavigate()
  const { progress } = usePinyinProgress()

  const totalLetters = LETTER_SEQUENCE.length
  const learnedLetters = LETTER_SEQUENCE.filter(e => progress.learned[letterEntryId(e)]).length
  const blendedCount = Object.keys(progress.learned).filter(id => id.startsWith('blend:')).length
  const charCount = Object.keys(progress.characterCorrect).length

  const stat: Record<string, string> = {
    letters: `已学 ${learnedLetters} / ${totalLetters}`,
    blend: `已拼出 ${blendedCount} 个音节`,
    characters: `已认 ${charCount} 个字`,
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-extrabold text-text">拼音岛</h1>
        </div>

        <div className="flex flex-col gap-4">
          {stages.map(stage => (
            <button
              key={stage.key}
              onClick={() => navigate(stage.path)}
              className="w-full min-h-24 rounded-2xl bg-pinyin-light border border-pinyin/20 shadow-sm px-6 py-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
            >
              <span className="text-3xl">{stage.icon}</span>
              <div className="text-left flex-1">
                <div className="text-xl font-bold text-text">{stage.title}</div>
                <div className="text-sm text-text-secondary">{stage.desc}</div>
              </div>
              <span className="text-xs text-text-secondary whitespace-nowrap">{stat[stage.key]}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          三个阶段可自由进入，循序渐进更好哦
        </p>
      </div>
    </PageContainer>
  )
}
