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
  const cellSize = Math.min(Math.floor((window.innerWidth - 32) / size), 56)

  return (
    <div
      className="inline-grid border-2 border-gray-800 rounded-lg overflow-hidden"
      style={{
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
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
              className={`flex items-center justify-center ${borderRight} ${borderBottom} ${bg} transition-colors`}
              style={{ width: cellSize, height: cellSize }}
              onClick={() => onSelectCell(r, c)}
            >
              {val !== 0 && (
                <span className={`text-lg font-bold ${
                  isGiven ? 'text-gray-800' :
                  isConflict ? 'text-danger' :
                  'text-primary'
                }`}>
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
