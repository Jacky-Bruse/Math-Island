interface Props {
  label: string
  accentClass: string // 类别分色（文字色）
  learned: boolean
  onClick: () => void
  title?: string
}

export default function LetterCard({ label, accentClass, learned, onClick, title }: Props) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative aspect-square rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center active:scale-95 transition-transform"
    >
      <span className={`text-2xl font-extrabold ${accentClass}`}>{label}</span>
      {learned && (
        <span className="absolute top-1 right-1.5 text-xs" aria-label="已学过">⭐</span>
      )}
    </button>
  )
}
