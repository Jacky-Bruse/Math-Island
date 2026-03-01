import { useState, useEffect, useRef } from 'react'

const REST_DURATION = 3 * 60 * 1000

interface Props {
  onDone: () => void
}

export default function RestCountdown({ onDone }: Props) {
  const startRef = useRef(Date.now())
  const [remaining, setRemaining] = useState(REST_DURATION)

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const left = Math.max(0, REST_DURATION - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(timer)
        onDone()
      }
    }, 200)
    return () => clearInterval(timer)
  }, [onDone])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">😴</div>
        <h2 className="text-xl font-bold mb-2">休息时间</h2>
        <p className="text-text-secondary mb-8">闭上眼睛，放松一下</p>
        <div className="text-6xl font-bold text-primary mb-8 tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <button
          onClick={onDone}
          className="min-w-40 min-h-14 rounded-xl bg-white shadow-sm text-text font-semibold active:scale-95 transition-transform"
        >
          立即继续
        </button>
      </div>
    </div>
  )
}
