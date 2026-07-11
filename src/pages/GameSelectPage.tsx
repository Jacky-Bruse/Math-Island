import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'

const games = [
  {
    key: 'sudoku',
    title: '数独',
    desc: '4×4 / 6×6 / 8×8',
    path: '/games/sudoku',
    icon: '🧩',
  },
  {
    key: 'robot-courier',
    title: '机器人快递员',
    desc: '星球配送任务',
    path: '/games/robot-courier',
    icon: '🤖',
  },
] as const

export default function GameSelectPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold">游戏</h1>
        </div>

        <div className="flex flex-col gap-4">
          {games.map(game => (
            <button
              key={game.key}
              onClick={() => navigate(game.path)}
              className="w-full min-h-24 rounded-2xl bg-sudoku-light border border-sudoku/20 shadow-sm px-6 py-5 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4 text-left">
                <span className="text-3xl">{game.icon}</span>
                <div>
                  <div className="text-xl font-bold text-text">{game.title}</div>
                  <div className="text-sm text-text-secondary">{game.desc}</div>
                </div>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
