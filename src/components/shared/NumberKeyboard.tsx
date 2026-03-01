interface Props {
  onInput: (digit: number) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  disabled?: boolean
}

export default function NumberKeyboard({ onInput, onBackspace, onClear, onConfirm, disabled }: Props) {
  const btnClass = 'w-full min-h-[clamp(3.4rem,7.8vh,4.6rem)] rounded-2xl bg-white shadow-sm text-[clamp(1.2rem,2.7vw,1.9rem)] font-bold active:scale-95 transition-transform disabled:opacity-40'

  return (
    <div className="grid grid-cols-4 gap-2.5 md:gap-3 p-2 md:p-3 max-w-3xl mx-auto">
      {[1, 2, 3].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button className={`${btnClass} bg-gray-100 text-[clamp(1rem,2.1vw,1.3rem)]`} onClick={onBackspace} disabled={disabled}>
        ⌫
      </button>
      {[4, 5, 6].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button className={`${btnClass} bg-gray-100 text-[clamp(0.95rem,2vw,1.2rem)]`} onClick={onClear} disabled={disabled}>
        清空
      </button>
      {[7, 8, 9].map(n => (
        <button key={n} className={btnClass} onClick={() => onInput(n)} disabled={disabled}>{n}</button>
      ))}
      <button
        className="w-full min-h-[clamp(3.4rem,7.8vh,4.6rem)] rounded-2xl bg-primary text-white shadow-sm text-[clamp(1.05rem,2.3vw,1.45rem)] font-bold active:scale-95 transition-transform disabled:opacity-40 row-span-1"
        onClick={onConfirm}
        disabled={disabled}
      >
        确认
      </button>
      <button className={`${btnClass} col-span-2`} onClick={() => onInput(0)} disabled={disabled}>0</button>
      <div />
    </div>
  )
}
