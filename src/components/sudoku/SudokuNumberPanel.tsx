import type { SudokuSize } from '../../types/sudoku'

interface Props {
  size: SudokuSize
  onNumber: (num: number) => void
  onErase: () => void
  disabled?: boolean
}

export default function SudokuNumberPanel({ size, onNumber, onErase, disabled }: Props) {
  const numbers = Array.from({ length: size }, (_, i) => i + 1)

  return (
    <div className="flex flex-wrap justify-center gap-2 px-2">
      {numbers.map(n => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          disabled={disabled}
          className="min-w-14 min-h-14 rounded-xl bg-white shadow-sm text-xl font-bold active:scale-95 transition-transform disabled:opacity-40"
        >
          {n}
        </button>
      ))}
      <button
        onClick={onErase}
        disabled={disabled}
        className="min-w-14 min-h-14 rounded-xl bg-gray-100 shadow-sm text-base font-semibold active:scale-95 transition-transform disabled:opacity-40"
      >
        擦除
      </button>
    </div>
  )
}
