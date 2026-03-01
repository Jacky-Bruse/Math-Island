import { useCallback, useRef, useEffect } from 'react'

type SoundType = 'click' | 'correct' | 'wrong' | 'hint' | 'complete'

const audioCtxRef: { current: AudioContext | null } = { current: null }

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext()
  }
  return audioCtxRef.current
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playClick() {
  playTone(800, 0.05, 'sine', 0.15)
}

function playCorrect() {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  ;[523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.1)
    gain.gain.setValueAtTime(0.25, now + i * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.2)
  })
}

function playWrong() {
  playTone(200, 0.3, 'sawtooth', 0.15)
}

function playHint() {
  playTone(600, 0.15, 'triangle', 0.2)
  setTimeout(() => playTone(800, 0.15, 'triangle', 0.2), 150)
}

function playComplete() {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.08)
    gain.gain.setValueAtTime(0.2, now + i * 0.08)
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.08)
    osc.stop(now + i * 0.08 + 0.15)
  })
}

const soundMap: Record<SoundType, () => void> = {
  click: playClick,
  correct: playCorrect,
  wrong: playWrong,
  hint: playHint,
  complete: playComplete,
}

export function useSound(isMuted: boolean) {
  const mutedRef = useRef(isMuted)

  useEffect(() => {
    mutedRef.current = isMuted
  }, [isMuted])

  const play = useCallback((type: SoundType) => {
    if (mutedRef.current) return
    try {
      soundMap[type]()
    } catch {
      // Audio not supported
    }
  }, [])

  return { play }
}
