import { useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import TrainingShell from '../components/training/TrainingShell'
import type { TrainingShellContext } from '../components/training/TrainingShell'
import SudokuBoard from '../components/sudoku/SudokuBoard'
import SudokuNumberPanel from '../components/sudoku/SudokuNumberPanel'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { useSudoku } from '../hooks/useSudoku'
import { useSudokuDraft } from '../hooks/useSudokuDraft'
import { useSudokuIdle } from '../hooks/useSudokuIdle'
import type { SudokuSize } from '../types/sudoku'

function SudokuContent({ ctx }: { ctx: TrainingShellContext }) {
  const params = useParams()
  const size = (Number(params.size) || 4) as SudokuSize
  const sudoku = useSudoku(size)
  const draft = useSudokuDraft(size)
  const [idleWarning, setIdleWarning] = useState(false)
  const { loadNewPuzzle, restoreFromDraft } = sudoku
  const { load: loadDraft, save: saveDraft } = draft

  const isInContinue = ctx.state.phase === 'continue'

  // Single initialization path: draft first, then fallback to new puzzle.
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const d = await loadDraft()
      if (cancelled) return

      if (d) {
        restoreFromDraft(d)
        return
      }

      await loadNewPuzzle()
    }

    init()

    return () => {
      cancelled = true
    }
  }, [loadDraft, loadNewPuzzle, restoreFromDraft])

  // 每次盘面/提示次数变化自动存草稿，任何退出路径都不丢进度
  useEffect(() => {
    if (sudoku.loading || !sudoku.puzzle || sudoku.isComplete) return
    saveDraft(sudoku.puzzle.givens, sudoku.puzzle.solution, sudoku.board, sudoku.hintsRemaining)
  }, [sudoku.loading, sudoku.puzzle, sudoku.isComplete, sudoku.board, sudoku.hintsRemaining, saveDraft])

  const handleWarning = useCallback(() => {
    setIdleWarning(true)
  }, [])

  const handleTimeout = useCallback(() => {
    ctx.exitToHome()
  }, [ctx])

  const idle = useSudokuIdle({
    active: isInContinue,
    onWarning: handleWarning,
    onTimeout: handleTimeout,
  })

  const handlePlaceNumber = (num: number) => {
    sudoku.placeNumber(num)
    idle.recordAction()
  }

  const handleErase = () => {
    sudoku.eraseCell()
    idle.recordAction()
  }

  const handleCheckComplete = () => {
    const complete = sudoku.checkComplete()
    if (complete) {
      ctx.recordCompleted(1)
      draft.remove()
      ctx.finish()
      return
    }
    ctx.playSound('wrong')
    ctx.recordError(1)
  }

  if (sudoku.loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-secondary">加载中...</div>
      </div>
    )
  }

  if (!sudoku.puzzle) return null

  return (
    <div className="flex-1 flex flex-col items-center justify-between py-2 md:py-3 px-2 md:px-3">
      {/* Board */}
      <div className="flex-1 flex items-center justify-center">
        <SudokuBoard
          board={sudoku.board}
          givens={sudoku.puzzle.givens}
          size={size}
          selectedRow={sudoku.selectedRow}
          selectedCol={sudoku.selectedCol}
          conflicts={sudoku.conflicts}
          highlightedCell={sudoku.highlightedCell}
          onSelectCell={(r, c) => {
            sudoku.selectCell(r, c)
            idle.recordAction()
          }}
        />
      </div>

      {/* Controls */}
      <div className="w-full max-w-xl space-y-3 md:space-y-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5">
        <div className="flex justify-center gap-3">
          <button
            onClick={sudoku.useHint}
            disabled={sudoku.hintsRemaining <= 0}
            className="min-h-[3.2rem] md:min-h-14 px-4 md:px-6 text-base md:text-lg rounded-xl bg-secondary-light/30 text-secondary font-semibold active:scale-95 transition-transform disabled:opacity-40"
          >
            💡 提示 ({sudoku.hintsRemaining})
          </button>
          <button
            onClick={handleCheckComplete}
            className="min-h-[3.2rem] md:min-h-14 px-4 md:px-6 text-base md:text-lg rounded-xl bg-success text-white font-semibold active:scale-95 transition-transform"
          >
            ✅ 完成
          </button>
        </div>

        <SudokuNumberPanel
          size={size}
          onNumber={handlePlaceNumber}
          onErase={handleErase}
        />
      </div>

      {/* Idle warning */}
      <ConfirmDialog
        open={idleWarning}
        title="还在吗？"
        onConfirm={() => {
          setIdleWarning(false)
          idle.recordAction()
        }}
        onCancel={() => ctx.exitToHome()}
        confirmText="继续"
        cancelText="保存退出"
      >
        <p>好像很久没有操作了，还要继续吗？</p>
      </ConfirmDialog>
    </div>
  )
}

export default function SudokuTrainingPage() {
  return (
    <TrainingShell module="sudoku">
      {(ctx) => <SudokuContent ctx={ctx} />}
    </TrainingShell>
  )
}
