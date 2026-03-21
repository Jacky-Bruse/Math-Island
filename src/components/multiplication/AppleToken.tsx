interface Props {
  number: number
  compact?: boolean
  highlighted?: boolean
  showNumber?: boolean
}

export default function AppleToken({
  number,
  compact = false,
  highlighted = false,
  showNumber = false,
}: Props) {
  return (
    <div className={`apple-token ${compact ? 'apple-token--compact' : ''} ${highlighted ? 'apple-token--highlighted' : ''}`}>
      <div className="apple-token__leaf" />
      {showNumber && (
        <div className="apple-token__label">
          {number}
        </div>
      )}
    </div>
  )
}
