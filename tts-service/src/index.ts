import express from 'express'
import { EdgeTTS } from 'node-edge-tts'
import { tmpdir } from 'os'
import { join } from 'path'
import { createReadStream } from 'fs'
import { unlink } from 'fs/promises'
import { randomUUID } from 'crypto'

const app = express()
app.use(express.json())

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

const PORT = parseInt(process.env.PORT || '3001', 10)
app.listen(PORT, () => {
  console.log(`TTS service running on port ${PORT}`)
})
