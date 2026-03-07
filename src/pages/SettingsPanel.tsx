import { useState, useEffect } from 'react'
import type { Settings } from '../types/settings'
import { fetchVoices, getTtsBaseUrl, checkTtsHealth } from '../lib/tts'

interface Props {
  open: boolean
  settings: Settings
  onUpdate: (patch: Partial<Settings>) => void
  onClose: () => void
  onClearData: () => void
}

export default function SettingsPanel({ open, settings, onUpdate, onClose, onClearData }: Props) {
  const [voices, setVoices] = useState<{ name: string; displayName: string }[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customUrl, setCustomUrl] = useState(settings.poemTtsServiceUrl)
  const [customUrlError, setCustomUrlError] = useState('')

  // 加载语音列表
  useEffect(() => {
    if (!open) return
    const baseUrl = getTtsBaseUrl({
      poemTtsUseCustomService: settings.poemTtsUseCustomService,
      poemTtsServiceUrl: settings.poemTtsServiceUrl,
    })
    fetchVoices(baseUrl).then(setVoices).catch(() => {})
  }, [open, settings.poemTtsUseCustomService, settings.poemTtsServiceUrl])

  useEffect(() => {
    setCustomUrl(settings.poemTtsServiceUrl)
  }, [settings.poemTtsServiceUrl])

  if (!open) return null

  const handleSaveCustomUrl = async () => {
    setCustomUrlError('')
    const url = customUrl.trim().replace(/\/+$/, '')

    if (!url) {
      setCustomUrlError('请输入服务地址')
      return
    }

    try {
      new URL(url)
    } catch {
      setCustomUrlError('地址格式无效')
      return
    }

    const ok = await checkTtsHealth(url)
    if (!ok) {
      setCustomUrlError('健康检查失败，请确认服务已启动')
      return
    }

    onUpdate({ poemTtsUseCustomService: true, poemTtsServiceUrl: url })
    setShowAdvanced(false)
  }

  const handleResetDefault = () => {
    onUpdate({ poemTtsUseCustomService: false, poemTtsServiceUrl: '' })
    setCustomUrl('')
    setCustomUrlError('')
    setShowAdvanced(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl shadow-xl w-full max-w-lg p-6 pb-8 animate-slide-up max-h-[85dvh] overflow-y-auto"
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

        {/* === 古诗朗读设置 === */}
        <div className="mt-2 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-poem mb-3">古诗朗读</div>

          {/* 朗读开关 */}
          <div className="flex items-center justify-between py-2">
            <span className="font-medium">启用朗读</span>
            <button
              onClick={() => onUpdate({ poemTtsEnabled: !settings.poemTtsEnabled })}
              className={`w-14 h-8 rounded-full transition-colors relative ${settings.poemTtsEnabled ? 'bg-poem' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.poemTtsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {settings.poemTtsEnabled && (
            <>
              {/* 语音角色 */}
              {voices.length > 0 && (
                <div className="py-2">
                  <span className="text-sm text-text-secondary">语音角色</span>
                  <select
                    value={settings.poemTtsVoice}
                    onChange={e => onUpdate({ poemTtsVoice: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-text focus:outline-none focus:border-poem"
                  >
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>{v.displayName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 语速 */}
              <div className="py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">语速</span>
                  <span className="text-sm text-text-secondary">{settings.poemTtsRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.poemTtsRate}
                  onChange={e => onUpdate({ poemTtsRate: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-poem"
                />
              </div>

              {/* 音调 */}
              <div className="py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">音调</span>
                  <span className="text-sm text-text-secondary">{settings.poemTtsPitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.poemTtsPitch}
                  onChange={e => onUpdate({ poemTtsPitch: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-poem"
                />
              </div>

              {/* 朗读标题 */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">朗读标题</span>
                <button
                  onClick={() => onUpdate({ poemReadTitle: !settings.poemReadTitle })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${settings.poemReadTitle ? 'bg-poem' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.poemReadTitle ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* 朗读作者信息 */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">朗读作者信息</span>
                <button
                  onClick={() => onUpdate({ poemReadMeta: !settings.poemReadMeta })}
                  className={`w-12 h-7 rounded-full transition-colors relative ${settings.poemReadMeta ? 'bg-poem' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.poemReadMeta ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* 高级服务设置 */}
              <div className="pt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-text-secondary underline"
                >
                  {showAdvanced ? '收起高级设置' : '高级服务设置'}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50">
                    <div className="text-xs text-text-secondary mb-2">
                      当前模式：{settings.poemTtsUseCustomService ? '自定义接口' : '默认内置接口'}
                    </div>

                    <input
                      type="text"
                      value={customUrl}
                      onChange={e => { setCustomUrl(e.target.value); setCustomUrlError('') }}
                      placeholder="如：http://192.168.1.100:3001/api"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-text focus:outline-none focus:border-poem"
                    />
                    {customUrlError && (
                      <p className="text-danger text-xs mt-1">{customUrlError}</p>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveCustomUrl}
                        className="flex-1 py-2 rounded-lg bg-poem text-white text-sm font-semibold active:scale-95 transition-transform"
                      >
                        保存并检测
                      </button>
                      {settings.poemTtsUseCustomService && (
                        <button
                          onClick={handleResetDefault}
                          className="flex-1 py-2 rounded-lg bg-gray-200 text-text text-sm font-semibold active:scale-95 transition-transform"
                        >
                          恢复默认
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
