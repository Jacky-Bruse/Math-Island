import type { Settings } from '../types/settings'

interface Props {
  open: boolean
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
  onClose: () => void
  onClearData: () => void
}

export default function SettingsPanel({ open, settings, onUpdate, onClose, onClearData }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-xl w-full max-w-lg p-6 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">设置</h2>
          <button
            onClick={onClose}
            className="min-w-10 min-h-10 flex items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-transform"
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 声音 */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="font-medium">声音</span>
          <button
            onClick={() => onUpdate({ sound: !settings.sound })}
            className={`w-14 h-8 rounded-full transition-colors relative ${settings.sound ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.sound ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* 训练时段 */}
        <div className="py-3 border-b border-gray-100">
          <span className="font-medium">训练时段</span>
          <div className="flex gap-2 mt-2">
            {([15, 20, 30] as const).map(d => (
              <button
                key={d}
                onClick={() => onUpdate({ trainingDuration: d })}
                className={`flex-1 min-h-12 rounded-xl font-semibold transition-colors ${
                  settings.trainingDuration === d
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text'
                }`}
              >
                {d}分钟
              </button>
            ))}
          </div>
        </div>

        {/* 数独默认尺寸 */}
        <div className="py-3 border-b border-gray-100">
          <span className="font-medium">数独默认尺寸</span>
          <div className="flex gap-2 mt-2">
            {([4, 6, 8] as const).map(s => (
              <button
                key={s}
                onClick={() => onUpdate({ defaultSudokuSize: s })}
                className={`flex-1 min-h-12 rounded-xl font-semibold transition-colors ${
                  settings.defaultSudokuSize === s
                    ? 'bg-sudoku text-white'
                    : 'bg-gray-100 text-text'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* 清空数据 */}
        <div className="pt-4">
          <button
            onClick={onClearData}
            className="w-full min-h-12 rounded-xl bg-danger-light/30 text-danger font-semibold active:scale-95 transition-transform"
          >
            清空本地数据
          </button>
        </div>
      </div>
    </div>
  )
}
