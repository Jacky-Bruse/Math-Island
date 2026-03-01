interface Props {
  onInput: (digit: number) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  disabled?: boolean
}

export default function NumberKeyboard({ onInput, onBackspace, onClear, onConfirm, disabled }: Props) {
  const btnClass = "min-w-14 min-h-14 rounded-xl bg-white shadow-sm text-xl font-bold active:scale-95 transition-transform disabled:opacity-40"

  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {[1, 2, 3].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button className={`${btnClass} bg-gray-100 text-base`} onClick={onBackspace} disabled={disabled}>
        ⌫
      </button>
      {[4, 5, 6].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button className={`${btnClass} bg-gray-100 text-sm`} onClick={onClear} disabled={disabled}>
        清空
      </button>
      {[7, 8, 9].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button
        className="min-w-14 min-h-14 rounded-xl bg-primary text-white shadow-sm text-lg font-bold active:scale-95 transition-transform disabled:opacity-40 row-span-1"
        onClick={onConfirm}
        disabled={disabled}
      >
        确认
      </button>
      <button className={`${btnClass} col-span-2`} onClick={() => onInput(0)} disabled={disabled}>0</button>
      <div /> {/* spacer */}
    </div>
  )
}
