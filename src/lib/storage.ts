import type { Settings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { PinyinProgress } from '../types/pinyin'
import { PINYIN_PROGRESS_VERSION } from '../types/pinyin'

const PREFIX = 'math-island:'

const KEYS = {
  settings: `${PREFIX}settings`,
  lastModule: `${PREFIX}lastModule`,
  lastArithRange: `${PREFIX}lastArithRange`,
  lastSudokuSize: `${PREFIX}lastSudokuSize`,
  pinyinProgress: `${PREFIX}pinyin-progress`,
} as const

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEYS.settings)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

export function loadLastModule(): string | null {
  return localStorage.getItem(KEYS.lastModule)
}

export function saveLastModule(module: string): void {
  localStorage.setItem(KEYS.lastModule, module)
}

export function loadLastArithRange(): number | null {
  const val = localStorage.getItem(KEYS.lastArithRange)
  return val ? Number(val) : null
}

export function saveLastArithRange(range: number): void {
  localStorage.setItem(KEYS.lastArithRange, String(range))
}

export function loadLastSudokuSize(): number | null {
  const val = localStorage.getItem(KEYS.lastSudokuSize)
  return val ? Number(val) : null
}

export function saveLastSudokuSize(size: number): void {
  localStorage.setItem(KEYS.lastSudokuSize, String(size))
}

function freshPinyinProgress(): PinyinProgress {
  return { version: PINYIN_PROGRESS_VERSION, learned: {}, characterCorrect: {} }
}

export function loadPinyinProgress(): PinyinProgress {
  try {
    const raw = localStorage.getItem(KEYS.pinyinProgress)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PinyinProgress>
      if (parsed.version === PINYIN_PROGRESS_VERSION) {
        return {
          version: PINYIN_PROGRESS_VERSION,
          learned: parsed.learned ?? {},
          characterCorrect: parsed.characterCorrect ?? {},
        }
      }
      // 版本不符：丢弃旧结构，重置（迁移点）
    }
  } catch { /* ignore */ }
  return freshPinyinProgress()
}

export function savePinyinProgress(progress: PinyinProgress): void {
  localStorage.setItem(KEYS.pinyinProgress, JSON.stringify(progress))
}

export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key))
}
