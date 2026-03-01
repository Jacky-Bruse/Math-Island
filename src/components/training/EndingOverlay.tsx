import { useNavigate } from 'react-router-dom'

interface Props {
  onReset: () => void
}

export default function EndingOverlay({ onReset }: Props) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    onReset()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-yellow-50 to-orange-50">
      <div className="text-center px-6">
        <div className="text-7xl mb-4">🌟</div>
        <h2 className="text-2xl font-bold mb-2">太棒了！</h2>
        <p className="text-text-secondary mb-8">今天的训练完成啦！</p>
        <button
          onClick={handleGoHome}
          className="min-w-48 min-h-14 rounded-xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform"
        >
          回到首页
        </button>
      </div>
    </div>
  )
}
