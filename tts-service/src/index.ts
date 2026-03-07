import express, { type Request, type Response, type NextFunction } from 'express'
import { EdgeTTS } from 'node-edge-tts'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { createReadStream, existsSync, mkdirSync } from 'fs'
import { readFile, writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(express.json())

// ---------- Poems data persistence ----------

interface Poem {
  id: string
  title: string
  author?: string
  dynasty?: string
  content: string
  createdAt: number
  updatedAt: number
}

const DATA_DIR = join(__dirname, '..', 'data')
const POEMS_FILE = join(DATA_DIR, 'poems.json')

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

async function loadPoems(): Promise<Poem[]> {
  try {
    const raw = await readFile(POEMS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function savePoems(poems: Poem[]): Promise<void> {
  await writeFile(POEMS_FILE, JSON.stringify(poems, null, 2), 'utf-8')
}

// ---------- Admin password middleware ----------

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_PASSWORD) {
    res.status(403).json({ error: '服务端未配置管理密码' })
    return
  }
  const password = req.headers['x-admin-password']
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: '密码错误' })
    return
  }
  next()
}

const CHINESE_VOICES = [
  { name: 'zh-CN-XiaoxiaoNeural', displayName: '晓晓（女声，温暖）' },
  { name: 'zh-CN-YunxiNeural', displayName: '云希（男声，沉稳）' },
  { name: 'zh-CN-XiaoyiNeural', displayName: '晓伊（女声，活泼）' },
  { name: 'zh-CN-YunjianNeural', displayName: '云健（男声，阳刚）' },
  { name: 'zh-CN-YunyangNeural', displayName: '云扬（男声，专业）' },
  { name: 'zh-CN-XiaoshuangNeural', displayName: '晓双（童声）' },
  { name: 'zh-CN-XiaohanNeural', displayName: '晓涵（女声，亲切）' },
  { name: 'zh-CN-XiaomengNeural', displayName: '晓梦（女声，甜美）' },
  { name: 'zh-CN-XiaomoNeural', displayName: '晓墨（女声，知性）' },
  { name: 'zh-CN-XiaoruiNeural', displayName: '晓瑞（女声，沉稳）' },
  { name: 'zh-CN-XiaoxuanNeural', displayName: '晓萱（女声，活力）' },
  { name: 'zh-CN-YunfengNeural', displayName: '云枫（男声，大气）' },
  { name: 'zh-CN-YunhaoNeural', displayName: '云浩（男声，浑厚）' },
  { name: 'zh-CN-YunxiaNeural', displayName: '云夏（男声，少年）' },
  { name: 'zh-CN-YunzeNeural', displayName: '云泽（男声，成熟）' },
]

function formatRateOrPitch(value: number): string {
  if (value === 1.0) return 'default'
  const percent = Math.round((value - 1) * 100)
  return `${percent >= 0 ? '+' : ''}${percent}%`
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/voices', (_req, res) => {
  res.json({ voices: CHINESE_VOICES })
})

app.post('/api/tts', async (req, res) => {
  const { text, voice = 'zh-CN-XiaoxiaoNeural', rate = 1.0, pitch = 1.0 } = req.body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  const tempFile = join(tmpdir(), `tts-${randomUUID()}.mp3`)

  try {
    const tts = new EdgeTTS({
      voice,
      lang: 'zh-CN',
      rate: formatRateOrPitch(rate),
      pitch: formatRateOrPitch(pitch),
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      timeout: 15000,
    })

    await tts.ttsPromise(text, tempFile)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-cache')
    const stream = createReadStream(tempFile)
    stream.pipe(res)
    stream.on('close', () => {
      unlink(tempFile).catch(() => {})
    })
  } catch (err) {
    unlink(tempFile).catch(() => {})
    console.error('TTS synthesis failed:', err)
    res.status(500).json({ error: 'TTS synthesis failed' })
  }
})

// ---------- Poem API routes ----------

// 验证密码
app.post('/api/admin/verify', (req, res) => {
  if (!ADMIN_PASSWORD) {
    res.status(403).json({ error: '服务端未配置管理密码' })
    return
  }
  const password = req.headers['x-admin-password']
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: '密码错误' })
    return
  }
  res.json({ ok: true })
})

// 获取全部古诗
app.get('/api/poems', async (_req, res) => {
  const poems = await loadPoems()
  res.json(poems)
})

app.get('/api/poems/export', async (_req, res) => {
  const poems = await loadPoems()
  const md = poems
    .map(p => {
      const lines = [p.title]
      const contentLines = p.content.split('\n').filter((l: string) => l.trim().length > 0)
      lines.push(...contentLines)
      return lines.join('\n')
    })
    .join('\n\n---\n\n')
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.send(md)
})

// 获取单首古诗
app.get('/api/poems/:id', async (req, res) => {
  const poems = await loadPoems()
  const poem = poems.find(p => p.id === req.params.id)
  if (!poem) {
    res.status(404).json({ error: '古诗不存在' })
    return
  }
  res.json(poem)
})

// 导出全部（Markdown 文本）
app.get('/api/poems/export', async (_req, res) => {
  const poems = await loadPoems()
  const md = poems
    .map(p => {
      const lines = [p.title]
      const contentLines = p.content.split('\n').filter((l: string) => l.trim().length > 0)
      lines.push(...contentLines)
      return lines.join('\n')
    })
    .join('\n\n---\n\n')
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.send(md)
})

// 新增古诗
app.post('/api/poems', requireAdmin, async (req, res) => {
  const { title, author, dynasty, content } = req.body
  if (!title || !content) {
    res.status(400).json({ error: '标题和正文不能为空' })
    return
  }
  const now = Date.now()
  const poem: Poem = {
    id: randomUUID(),
    title: title.trim(),
    author: author?.trim() || undefined,
    dynasty: dynasty?.trim() || undefined,
    content,
    createdAt: now,
    updatedAt: now,
  }
  const poems = await loadPoems()
  poems.push(poem)
  await savePoems(poems)
  res.status(201).json(poem)
})

// 编辑古诗
app.put('/api/poems/:id', requireAdmin, async (req, res) => {
  const { title, author, dynasty, content } = req.body
  const poems = await loadPoems()
  const index = poems.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: '古诗不存在' })
    return
  }
  poems[index] = {
    ...poems[index],
    title: title?.trim() ?? poems[index].title,
    author: author?.trim() || undefined,
    dynasty: dynasty?.trim() || undefined,
    content: content ?? poems[index].content,
    updatedAt: Date.now(),
  }
  await savePoems(poems)
  res.json(poems[index])
})

// 删除古诗
app.delete('/api/poems/:id', requireAdmin, async (req, res) => {
  const poems = await loadPoems()
  const index = poems.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: '古诗不存在' })
    return
  }
  poems.splice(index, 1)
  await savePoems(poems)
  res.json({ ok: true })
})

// 批量导入
app.post('/api/poems/import', requireAdmin, async (req, res) => {
  const incoming: { title: string; author?: string; dynasty?: string; content: string }[] = req.body
  if (!Array.isArray(incoming)) {
    res.status(400).json({ error: '请求体必须是数组' })
    return
  }

  const poems = await loadPoems()
  const normalizeContent = (c: string) =>
    c.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0).join('\n')

  let added = 0
  let skipped = 0

  for (const p of incoming) {
    if (!p.title || !p.content) {
      skipped++
      continue
    }
    const isDup = poems.some(
      e => e.title === p.title && normalizeContent(e.content) === normalizeContent(p.content),
    )
    if (isDup) {
      skipped++
      continue
    }
    const now = Date.now()
    poems.push({
      id: randomUUID(),
      title: p.title,
      author: p.author?.trim() || undefined,
      dynasty: p.dynasty?.trim() || undefined,
      content: p.content,
      createdAt: now,
      updatedAt: now,
    })
    added++
  }

  await savePoems(poems)
  res.json({ added, skipped })
})

// ---------- Start server ----------

const PORT = parseInt(process.env.PORT || '3001', 10)
app.listen(PORT, () => {
  console.log(`TTS service running on port ${PORT}`)
})
