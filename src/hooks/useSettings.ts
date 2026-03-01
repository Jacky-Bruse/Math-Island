import { useState, useCallback } from 'react'
import type { Settings } from '../types/settings'
import { loadSettings, saveSettings } from '../lib/storage'

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
