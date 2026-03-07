import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import SettingsPanel from './SettingsPanel'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { useSettings } from '../hooks/useSettings'
import { useLongPress } from '../hooks/useLongPress'
import { clearAllData, saveLastModule } from '../lib/storage'
import { clearAllDB } from '../lib/db'

const modules = [
  {
    key: 'arithmetic',
    title: '加减法',
    desc: '10/20/100以内',
    path: '/arithmetic',
    color: 'bg-arithmetic-light',
    border: 'border-arithmetic/20',
    icon: '➕➖',
  },
  {
    key: 'comparison',
    title: '比大小',
    desc: '两位数比较',
    path: '/comparison',
    color: 'bg-comparison-light',
    border: 'border-comparison/20',
    icon: '🔢',
  },
  {
    key: 'sudoku',
    title: '数独',
    desc: '4×4 / 6×6 / 8×8',
    path: '/sudoku',
    color: 'bg-sudoku-light',
    border: 'border-sudoku/20',
    icon: '🧩',
  },
  {
    key: 'poem',
    title: '古诗阅读',
    desc: '朗读与跟读',
    path: '/poems',
    color: 'bg-poem-light',
    border: 'border-poem/20',
    icon: '📖',
  },
] as const

export default function HomePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const longPressProps = useLongPress(openSettings)

  const handleNavigate = (path: string, key: string) => {
    saveLastModule(key)
    navigate(path)
  }

  const handleClearData = () => {
    setClearConfirm(true)
  }

  const confirmClearData = async () => {
    clearAllData()
    await clearAllDB()
    setClearConfirm(false)
    setSettingsOpen(false)
    window.location.reload()
  }

  return (
    <PageContainer className="justify-center">
      <div className="w-full max-w-md">
        {/* 标题区 */}
        <div className="text-center mb-8" {...longPressProps}>
          <h1 className="text-4xl font-extrabold text-primary mb-1">数力岛</h1>
          <p className="text-text-secondary text-sm">长按此处打开设置</p>
        </div>

        {/* 三张卡片 */}
        <div className="flex flex-col gap-4">
          {modules.map(m => (
            <button
              key={m.key}
              onClick={() => handleNavigate(m.path, m.key)}
              className={`w-full min-h-24 rounded-2xl ${m.color} border ${m.border} shadow-sm px-6 py-5 flex items-center gap-4 active:scale-[0.98] transition-transform`}
            >
              <span className="text-3xl">{m.icon}</span>
              <div className="text-left">
                <div className="text-xl font-bold text-text">{m.title}</div>
                <div className="text-sm text-text-secondary">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 设置面板 */}
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onUpdate={updateSettings}
        onClose={() => setSettingsOpen(false)}
        onClearData={handleClearData}
      />

      {/* 清空确认 */}
      <ConfirmDialog
        open={clearConfirm}
        title="清空本地数据"
        onConfirm={confirmClearData}
        onCancel={() => setClearConfirm(false)}
        confirmText="清空"
        cancelText="取消"
      >
        <p>将清除所有设置、数独草稿和古诗数据，确定继续吗？</p>
      </ConfirmDialog>
    </PageContainer>
  )
}
