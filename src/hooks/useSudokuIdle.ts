import { useEffect, useRef, useCallback, useState } from 'react'

interface Props {
  active: boolean
  onWarning: () => void
  onTimeout: () => void
  warningMinutes?: number
  timeoutMinutes?: number
}

export function useSudokuIdle({ active, onWarning, onTimeout, warningMinutes = 15, timeoutMinutes = 2 }: Props) {
  const lastActionRef = useRef(Date.now())
  const [warned, setWarned] = useState(false)

  const recordAction = useCallback(() => {
    lastActionRef.current = Date.now()
    setWarned(false)
  }, [])

  useEffect(() => {
    if (!active) return

    const timer = setInterval(() => {
      const idle = Date.now() - lastActionRef.current

      if (!warned && idle >= warningMinutes * 60 * 1000) {
        setWarned(true)
        onWarning()
      }

      if (warned && idle >= (warningMinutes + timeoutMinutes) * 60 * 1000) {
        onTimeout()
      }
    }, 5000)

    return () => clearInterval(timer)
  }, [active, warned, warningMinutes, timeoutMinutes, onWarning, onTimeout])

  return { recordAction, warned }
}
