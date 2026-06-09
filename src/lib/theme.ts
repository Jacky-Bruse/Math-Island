import type { ThemeMode } from '../types/settings'
import { loadSettings } from './storage'

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function resolveIsDark(theme: ThemeMode): boolean {
  if (theme === 'system') return darkQuery().matches
  return theme === 'dark'
}

/**
 * 按显式主题值切换 <html> 上的 .dark 类。
 * 调用方应直接传入选中的值，不要依赖 localStorage（写入发生在 React 状态更新器内，可能滞后）。
 */
export function applyTheme(theme: ThemeMode): void {
  document.documentElement.classList.toggle('dark', resolveIsDark(theme))
}

let listenerAttached = false

/**
 * 启动时调用一次：
 * 1. 按当前存储的主题再校准一次（兜底首屏内联脚本缺失/异常的情况）；
 * 2. 挂一个常驻的系统主题监听器，仅当当前主题为 'system' 时才跟随系统变化。
 */
export function initTheme(): void {
  applyTheme(loadSettings().theme)

  if (listenerAttached) return
  listenerAttached = true
  darkQuery().addEventListener('change', () => {
    if (loadSettings().theme === 'system') {
      applyTheme('system')
    }
  })
}
