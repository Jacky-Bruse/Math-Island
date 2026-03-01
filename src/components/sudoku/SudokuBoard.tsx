import type { SudokuSize } from '../../types/sudoku'
import { BOX_SIZES } from '../../types/sudoku'

interface Props {
  board: number[][]
  givens: number[][]
  size: SudokuSize
  selectedRow: number | null
  selectedCol: number | null
  conflicts: Set<string>
  highlightedCell: { row: number; col: number } | null
  onSelectCell: (row: number, col: number) => void
}

export default function SudokuBoard({ board, givens, size, selectedRow, selectedCol, conflicts, highlightedCell, onSelectCell }: Props) {
  const [boxR, boxC] = BOX_SIZES[size]
  const boardSize =
    size === 4
      ? 'min(clamp(18rem, 62vw, 32rem), 58dvh)'
      : size === 6
        ? 'min(clamp(18rem, 68vw, 31rem), 56dvh)'
        : 'min(clamp(17rem, 72vw, 30rem), 54dvh)'
  const cellTextSize =
    size === 4
      ? 'clamp(1.35rem, 2.8vw, 2rem)'
      : size === 6
        ? 'clamp(1.1rem, 2.3vw, 1.65rem)'
        : 'clamp(0.95rem, 2.1vw, 1.45rem)'

  return (
    <div
      className="inline-grid border-2 border-gray-800 rounded-lg overflow-hidden"
      style={{
        width: boardSize,
        height: boardSize,
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
      }}
    >
      {board.map((row, r) =>
        row.map((val, c) => {
          const isGiven = givens[r][c] !== 0
          const isSelected = r === selectedRow && c === selectedCol
          const isSameRow = r === selectedRow
          const isSameCol = c === selectedCol
          const isSameBox =
            selectedRow !== null && selectedCol !== null &&
            Math.floor(r / boxR) === Math.floor(selectedRow / boxR) &&
            Math.floor(c / boxC) === Math.floor(selectedCol / boxC)
          const isConflict = conflicts.has(`${r},${c}`)
          const isHighlighted = highlightedCell?.row === r && highlightedCell?.col === c

          // Border logic for box separators
          const borderRight = (c + 1) % boxC === 0 && c < size - 1 ? 'border-r-2 border-r-gray-800' : 'border-r border-r-gray-300'
          const borderBottom = (r + 1) % boxR === 0 && r < size - 1 ? 'border-b-2 border-b-gray-800' : 'border-b border-b-gray-300'

          let bg = 'bg-white'
          if (isSelected) bg = 'bg-primary/20'
          else if (isHighlighted) bg = 'bg-secondary-light/50'
          else if (isConflict) bg = 'bg-danger-light/30'
          else if (isSameRow || isSameCol || isSameBox) bg = 'bg-primary/5'

          return (
            <button
              key={`${r}-${c}`}
              className={`w-full aspect-square flex items-center justify-center ${borderRight} ${borderBottom} ${bg} transition-colors`}
              onClick={() => onSelectCell(r, c)}
            >
              {val !== 0 && (
                <span className={`text-lg font-bold ${
                  isGiven ? 'text-gray-800' :
                  isConflict ? 'text-danger' :
                  'text-primary'
                }`} style={{ fontSize: cellTextSize }}>
                  {val}
                </span>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
