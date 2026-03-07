import test from 'node:test'
import assert from 'node:assert/strict'

import { getInterSegmentPauseMs } from '../src/lib/poem-tts-playback.ts'

test('uses a short pause in normal mode', () => {
  const pause = getInterSegmentPauseMs('normal', 1.8, {
    type: 'line',
    text: '床前明月光',
  })

  assert.ok(pause >= 200)
  assert.ok(pause <= 400)
})

test('uses the configured base pause and adapts by line length in follow mode', () => {
  const shortLinePause = getInterSegmentPauseMs('follow', 1.8, {
    type: 'line',
    text: '春眠不觉晓',
  })
  const longLinePause = getInterSegmentPauseMs('follow', 1.8, {
    type: 'line',
    text: '日照香炉生紫烟，遥看瀑布挂前川',
  })

  assert.ok(shortLinePause > 1800)
  assert.ok(longLinePause > shortLinePause)
})

test('keeps title and meta pauses shorter than line pauses in follow mode', () => {
  const titlePause = getInterSegmentPauseMs('follow', 1.8, {
    type: 'title',
    text: '静夜思',
  })
  const metaPause = getInterSegmentPauseMs('follow', 1.8, {
    type: 'meta',
    text: '唐 李白',
  })

  assert.ok(titlePause >= 1000)
  assert.ok(titlePause < 1800)
  assert.ok(metaPause >= 1000)
  assert.ok(metaPause < 1800)
})
