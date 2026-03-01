import type { SudokuSize } from '../../types/sudoku'

interface Props {
  size: SudokuSize
  onNumber: (num: number) => void
  onErase: () => void
  disabled?: boolean
}

export default function SudokuNumberPanel({ size, onNumber, onErase, disabled }: Props) {
  const numbers = Array.from({ length: size }, (_, i) => i + 1)
  const numberSizeClass =
    size === 8
      ? 'min-w-[clamp(2.75rem,6.6vw,3.4rem)] min-h-[clamp(2.75rem,6.6vw,3.4rem)] text-[clamp(1rem,2vw,1.3rem)]'
      : size === 6
        ? 'min-w-[clamp(2.95rem,7vw,3.8rem)] min-h-[clamp(2.95rem,7vw,3.8rem)] text-[clamp(1.05rem,2.2vw,1.45rem)]'
        : 'min-w-[clamp(3.2rem,7.5vw,4.2rem)] min-h-[clamp(3.2rem,7.5vw,4.2rem)] text-[clamp(1.15rem,2.4vw,1.6rem)]'
  const numberButtonClass = `${numberSizeClass} rounded-2xl bg-white shadow-sm font-bold active:scale-95 transition-transform disabled:opacity-40`
  const eraseButtonClass = `${numberSizeClass} rounded-2xl bg-gray-100 shadow-sm text-[clamp(0.95rem,1.9vw,1.2rem)] font-semibold active:scale-95 transition-transform disabled:opacity-40`

  return (
    <div className="flex flex-wrap justify-center gap-2.5 md:gap-3 px-2">
      {numbers.map(n => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          disabled={disabled}
          className={numberButtonClass}
        >
          {n}
        </button>
      ))}
      <button
        onClick={onErase}
        disabled={disabled}
        className={eraseButtonClass}
      >
        擦除
      </button>
    </div>
  )
}
