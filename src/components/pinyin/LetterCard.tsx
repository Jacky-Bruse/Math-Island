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
      aria-label={`${label}${learned ? '，已学过' : ''}`}
      className="relative aspect-square min-h-11 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center transition-[transform,border-color,box-shadow] hover:border-border-strong hover:shadow-md active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pinyin"
    >
      <span className={`text-2xl font-extrabold ${accentClass}`}>{label}</span>
      {learned && (
        <span className="absolute top-1 right-1.5 text-xs" aria-label="已学过">⭐</span>
      )}
    </button>
  )
}
