import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import PasswordDialog from '../components/shared/PasswordDialog'
import { fetchPoem, hasAdminAccess } from '../lib/poems-api'
import { usePoemLibrary } from '../hooks/usePoemLibrary'

export default function PoemEditorPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const { addPoem, updatePoem, removePoem } = usePoemLibrary()

  const [title, setTitle] = useState('')
  const [dynasty, setDynasty] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loaded, setLoaded] = useState(!isEdit)

  // 密码验证状态
  const [authenticated, setAuthenticated] = useState(hasAdminAccess())
  const [showPassword, setShowPassword] = useState(!hasAdminAccess())

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (!id) return
    fetchPoem(id).then(poem => {
      if (poem) {
        setTitle(poem.title)
        setDynasty(poem.dynasty || '')
        setAuthor(poem.author || '')
        setContent(poem.content)
      }
      setLoaded(true)
    }).catch(() => {
      setLoaded(true)
    })
  }, [id])

  const handlePasswordSuccess = () => {
    setShowPassword(false)
    setAuthenticated(true)
  }

  const handlePasswordCancel = () => {
    setShowPassword(false)
    navigate(-1)
  }

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {}

    if (!title.trim()) {
      newErrors.title = '请输入标题'
    }

    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length === 0) {
      newErrors.content = '请输入正文内容（至少一句）'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    const data = {
      title,
      author: author.trim() || undefined,
      dynasty: dynasty.trim() || undefined,
      content,
    }

    if (isEdit && id) {
      await updatePoem(id, data)
    } else {
      await addPoem(data)
    }

    navigate('/poems', { replace: true })
  }

  const handleDelete = async () => {
    if (!id) return
    await removePoem(id)
    navigate('/poems', { replace: true })
  }

  // 密码验证弹窗
  if (!authenticated) {
    return (
      <PageContainer>
        <PasswordDialog
          open={showPassword}
          onSuccess={handlePasswordSuccess}
          onCancel={handlePasswordCancel}
        />
      </PageContainer>
    )
  }

  if (!loaded) {
    return (
      <PageContainer>
        <div className="text-center text-text-secondary py-12">加载中...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        {/* 顶部栏 */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-text flex-1">
            {isEdit ? '编辑古诗' : '添加古诗'}
          </h1>
        </div>

        {/* 表单 */}
        <div className="flex flex-col gap-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">
              诗名 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="如：静夜思"
              className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-danger' : 'border-gray-200'} bg-white text-text text-base focus:outline-none focus:border-poem transition-colors`}
            />
            {errors.title && <p className="text-danger text-xs mt-1">{errors.title}</p>}
          </div>

          {/* 朝代 & 作者 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text mb-1.5">朝代</label>
              <input
                type="text"
                value={dynasty}
                onChange={e => setDynasty(e.target.value)}
                placeholder="如：唐"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text text-base focus:outline-none focus:border-poem transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-text mb-1.5">作者</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="如：李白"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text text-base focus:outline-none focus:border-poem transition-colors"
              />
            </div>
          </div>

          {/* 正文 */}
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">
              正文 <span className="text-danger">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'每行一句，如：\n床前明月光\n疑是地上霜\n举头望明月\n低头思故乡'}
              rows={8}
              className={`w-full px-4 py-3 rounded-xl border ${errors.content ? 'border-danger' : 'border-gray-200'} bg-white text-text text-base leading-relaxed resize-none focus:outline-none focus:border-poem transition-colors`}
            />
            {errors.content && <p className="text-danger text-xs mt-1">{errors.content}</p>}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleSave}
            className="w-full min-h-14 rounded-xl bg-poem text-white text-lg font-semibold active:scale-[0.98] transition-transform"
          >
            {isEdit ? '保存修改' : '添加古诗'}
          </button>

          {isEdit && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full min-h-14 rounded-xl bg-danger-light text-danger text-lg font-semibold active:scale-[0.98] transition-transform"
            >
              删除古诗
            </button>
          )}
        </div>
      </div>

      {/* 删除确认 */}
      <ConfirmDialog
        open={deleteConfirm}
        title="删除古诗"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        confirmText="删除"
        cancelText="取消"
      >
        <p>确定删除「{title}」吗？删除后无法恢复。</p>
      </ConfirmDialog>
    </PageContainer>
  )
}
