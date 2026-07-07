import type { Settings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { PinyinProgress } from '../types/pinyin'
import { PINYIN_PROGRESS_VERSION } from '../types/pinyin'

const PREFIX = 'math-island:'

const KEYS = {
  settings: `${PREFIX}settings`,
  pinyinProgress: `${PREFIX}pinyin-progress`,
} as const

// 历史版本写过、现已废弃的 key，清空数据时一并移除
const LEGACY_KEYS = [
  `${PREFIX}lastModule`,
  `${PREFIX}lastArithRange`,
  `${PREFIX}lastSudokuSize`,
]

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
  [...Object.values(KEYS), ...LEGACY_KEYS].forEach(key => localStorage.removeItem(key))
}
