import type { Settings } from '../types/settings'
import { DEFAULT_SETTINGS } from '../types/settings'
import type { PinyinProgress } from '../types/pinyin'
import { PINYIN_PROGRESS_VERSION } from '../types/pinyin'
import type { RobotCourierProgress } from '../types/robot-courier'

const PREFIX = 'math-island:'

const KEYS = {
  settings: `${PREFIX}settings`,
  pinyinProgress: `${PREFIX}pinyin-progress`,
  robotCourierProgress: `${PREFIX}robot-courier-progress`,
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

const ROBOT_COURIER_LEVEL_COUNT = 20

function freshRobotCourierProgress(): RobotCourierProgress {
  return { version: 1, unlockedLevel: 1, bestStars: {} }
}

export function loadRobotCourierProgress(): RobotCourierProgress {
  try {
    const raw = localStorage.getItem(KEYS.robotCourierProgress)
    if (!raw) return freshRobotCourierProgress()
    const parsed = JSON.parse(raw) as Partial<RobotCourierProgress>
    const storedLevel = parsed.unlockedLevel
    if (parsed.version !== 1 || typeof storedLevel !== 'number' || !Number.isInteger(storedLevel)) return freshRobotCourierProgress()
    const unlockedLevel = Math.min(ROBOT_COURIER_LEVEL_COUNT, Math.max(1, storedLevel))
    const bestStars: RobotCourierProgress['bestStars'] = {}
    if (parsed.bestStars && typeof parsed.bestStars === 'object') {
      for (const [key, value] of Object.entries(parsed.bestStars)) {
        const level = Number(key)
        if (Number.isInteger(level) && level >= 1 && level <= ROBOT_COURIER_LEVEL_COUNT && (value === 1 || value === 2 || value === 3)) {
          bestStars[level] = value
        }
      }
    }
    return { version: 1, unlockedLevel, bestStars }
  } catch {
    return freshRobotCourierProgress()
  }
}

export function saveRobotCourierProgress(progress: RobotCourierProgress): void {
  localStorage.setItem(KEYS.robotCourierProgress, JSON.stringify(progress))
}

export function clearAllData(): void {
  [...Object.values(KEYS), ...LEGACY_KEYS].forEach(key => localStorage.removeItem(key))
}
