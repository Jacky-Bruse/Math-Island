import type { ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDialog({
  open,
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-6 mx-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-center mb-3">{title}</h2>
        {children && <div className="text-text-secondary text-center mb-5">{children}</div>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 min-h-14 rounded-xl bg-gray-100 text-text font-semibold active:scale-95 transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 min-h-14 rounded-xl bg-primary text-white font-semibold active:scale-95 transition-transform"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
