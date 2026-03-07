import type { Poem } from '../../types/poem'

interface Props {
  previous: Poem | null
  next: Poem | null
  currentIndex: number
  total: number
  onNavigate: (poemId: string) => void
  compact?: boolean
}

export default function PoemPageNavigation({
  previous,
  next,
  currentIndex,
  total,
  onNavigate,
  compact = false,
}: Props) {
  const containerClass = compact
    ? 'rounded-2xl border border-poem/10 bg-white/85 px-4 py-3 shadow-sm'
    : 'rounded-3xl border border-poem/15 bg-white px-4 py-4 shadow-md'
  const metaClass = compact ? 'text-xs' : 'text-sm'

  return (
    <div className={containerClass}>
      <div className={`mb-3 text-center font-medium text-text-secondary ${metaClass}`}>
        第 {currentIndex + 1} 首 / 共 {total} 首
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NavButton
          label="上一首"
          poem={previous}
          align="left"
          onClick={onNavigate}
        />
        <NavButton
          label="下一首"
          poem={next}
          align="right"
          onClick={onNavigate}
        />
      </div>
    </div>
  )
}

function NavButton({
  label,
  poem,
  align,
  onClick,
}: {
  label: string
  poem: Poem | null
  align: 'left' | 'right'
  onClick: (poemId: string) => void
}) {
  const disabled = !poem
  const alignment = align === 'right' ? 'items-end text-right' : 'items-start text-left'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => poem && onClick(poem.id)}
      className={`min-h-20 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-transform active:scale-[0.98] disabled:opacity-35 disabled:active:scale-100 ${alignment} flex flex-col justify-center`}
    >
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      <span className="mt-1 line-clamp-1 text-sm font-semibold text-text">
        {poem ? `${label}：${poem.title}` : `${label}：无`}
      </span>
    </button>
  )
}
