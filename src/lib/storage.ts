import type { Settings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'

const PREFIX = 'math-island:'

const KEYS = {
  settings: `${PREFIX}settings`,
  lastModule: `${PREFIX}lastModule`,
  lastArithRange: `${PREFIX}lastArithRange`,
  lastSudokuSize: `${PREFIX}lastSudokuSize`,
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

export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key))
}
