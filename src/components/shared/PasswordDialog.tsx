import { useState } from 'react'
import { verifyPassword, setCachedPassword, AuthError } from '../../lib/poems-api'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export default function PasswordDialog({ open, onSuccess, onCancel }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const ok = await verifyPassword(password.trim())
      if (ok) {
        setCachedPassword(password.trim())
        setPassword('')
        onSuccess()
      } else {
        setError('密码错误')
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('验证失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-6 mx-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-center mb-3">家长验证</h2>
        <p className="text-text-secondary text-center text-sm mb-4">
          此操作需要家长密码
        </p>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="请输入密码"
          autoFocus
          className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-danger' : 'border-gray-200'} bg-white text-text text-base focus:outline-none focus:border-poem transition-colors mb-2`}
        />
        {error && <p className="text-danger text-xs mb-2">{error}</p>}
        <div className="flex gap-3 mt-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 min-h-12 rounded-xl bg-gray-100 text-text font-semibold active:scale-95 transition-transform"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 min-h-12 rounded-xl bg-poem text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? '验证中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 检查是否已通过密码验证（sessionStorage 中有缓存）。
 * 如果有缓存，直接返回 true；否则返回 false，调用者应弹出密码弹窗。
 */
