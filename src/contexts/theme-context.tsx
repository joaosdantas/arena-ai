import * as React from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'arena-ai-theme'

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>(getInitialMode)

  const resolvedTheme = mode === 'system' ? getSystemTheme() : mode

  React.useEffect(() => {
    applyTheme(mode)
  }, [mode])

  React.useEffect(() => {
    if (mode !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [mode])

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, nextMode)
    setModeState(nextMode)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setMode(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setMode])

  const value = React.useMemo(
    () => ({ mode, resolvedTheme, setMode, toggleTheme }),
    [mode, resolvedTheme, setMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
