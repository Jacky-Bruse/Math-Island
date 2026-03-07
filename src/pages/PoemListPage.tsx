import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/layout/PageContainer'
import BackButton from '../components/shared/BackButton'
import { usePoemLibrary } from '../hooks/usePoemLibrary'
import { parsePoemsMarkdown, exportPoemsMarkdown } from '../lib/poem-markdown'

export default function PoemListPage() {
  const navigate = useNavigate()
  const { poems, loading, importPoems } = usePoemLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null)

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parsePoemsMarkdown(text)
      if (parsed.length === 0) {
        setImportResult({ added: 0, skipped: 0 })
        return
      }
      const result = await importPoems(parsed)
      setImportResult(result)
    } catch {
      setImportResult({ added: 0, skipped: 0 })
    }

    // 清空 input 以便重复选同一文件
    e.target.value = ''
  }

  const handleExport = () => {
    if (poems.length === 0) return
    const md = exportPoemsMarkdown(poems)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '古诗集.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        {/* 顶部栏 */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <h1 className="text-2xl font-bold text-text flex-1">古诗阅读</h1>
          <button
            onClick={() => navigate('/poems/edit')}
            className="min-w-14 min-h-14 flex items-center justify-center rounded-xl bg-poem text-white shadow-sm active:scale-95 transition-transform"
            aria-label="新增古诗"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* 导入结果提示 */}
        {importResult && (
          <div className="mb-4 p-3 rounded-xl bg-poem-light text-sm text-text">
            导入完成：新增 {importResult.added} 首，跳过 {importResult.skipped} 首
            <button
              onClick={() => setImportResult(null)}
              className="ml-2 text-poem font-semibold"
            >
              关闭
            </button>
          </div>
        )}

        {/* 古诗列表 */}
        {loading ? (
          <div className="text-center text-text-secondary py-12">加载中...</div>
        ) : poems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-text-secondary mb-2">还没有古诗</p>
            <p className="text-text-secondary text-sm mb-6">点击右上角 + 添加，或导入 Markdown 文件</p>
            <button
              onClick={() => navigate('/poems/edit')}
              className="px-6 py-3 rounded-xl bg-poem text-white font-semibold active:scale-95 transition-transform"
            >
              添加第一首古诗
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {poems.map(poem => (
              <button
                key={poem.id}
                onClick={() => navigate(`/poems/${poem.id}`)}
                className="w-full rounded-2xl bg-white border border-poem/10 shadow-sm px-5 py-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="text-lg font-bold text-text mb-1">{poem.title}</div>
                {(poem.dynasty || poem.author) && (
                  <div className="text-sm text-text-secondary mb-2">
                    {[poem.dynasty, poem.author].filter(Boolean).join(' · ')}
                  </div>
                )}
                <div className="text-sm text-text-secondary line-clamp-2">
                  {poem.content.split('\n').filter(l => l.trim()).slice(0, 2).join('，')}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 管理区 */}
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={handleImport}
            className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm text-text-secondary font-medium active:scale-95 transition-transform"
          >
            导入 Markdown
          </button>
          {poems.length > 0 && (
            <button
              onClick={handleExport}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-sm text-text-secondary font-medium active:scale-95 transition-transform"
            >
              导出全部
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </PageContainer>
  )
}
