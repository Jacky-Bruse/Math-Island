import { useRef, useCallback } from 'react'

export function useLongPress(callback: () => void, delay = 800) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggeredRef = useRef(false)

  const onStart = useCallback(() => {
    triggeredRef.current = false
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true
      callback()
    }, delay)
  }, [callback, delay])

  const onEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onPointerDown: onStart,
    onPointerUp: onEnd,
    onPointerLeave: onEnd,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}
