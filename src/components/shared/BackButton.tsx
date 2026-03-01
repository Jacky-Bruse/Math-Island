import { useNavigate } from 'react-router-dom'

interface Props {
  onConfirm?: () => void
  needConfirm?: boolean
}

export default function BackButton({ onConfirm, needConfirm = false }: Props) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (needConfirm && onConfirm) {
      onConfirm()
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="min-w-14 min-h-14 flex items-center justify-center rounded-xl bg-white/80 shadow-sm active:scale-95 transition-transform"
      aria-label="返回"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}
