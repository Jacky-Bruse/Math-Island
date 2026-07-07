import { useSyncExternalStore, useCallback } from 'react'
import type { Settings } from '../types/settings'
import { loadSettings, saveSettings } from '../lib/storage'

// 模块级单例 store：所有 useSettings 实例共享同一份设置，任一处更新全局同步
let current: Settings = loadSettings()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Settings {
  return current
}

export function updateSettingsStore(patch: Partial<Settings>): void {
  current = { ...current, ...patch }
  saveSettings(current)
  listeners.forEach(listener => listener())
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot)
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    updateSettingsStore(patch)
  }, [])

  return { settings, updateSettings }
}
