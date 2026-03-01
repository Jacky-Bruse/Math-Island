interface Props {
  message: string
  visible: boolean
}

export default function MascotBubble({ message, visible }: Props) {
  if (!visible) return null

  return (
    <div className="flex items-start gap-2 mx-4 mb-4 animate-fade-in">
      <div className="text-3xl flex-shrink-0">🦊</div>
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 text-sm text-text leading-relaxed max-w-xs">
        {message}
      </div>
    </div>
  )
}
