import { useEffect, useState } from 'react'

interface Props {
  visible: boolean
}

export default function StarReward({ visible }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center">
      <div className="text-6xl animate-star-pop">⭐</div>
    </div>
  )
}
