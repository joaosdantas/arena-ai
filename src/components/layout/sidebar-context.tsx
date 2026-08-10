import * as React from 'react'

interface SidebarContextValue {
  collapsed: boolean
  mobileOpen: boolean
  setCollapsed: (value: boolean) => void
  toggleCollapsed: () => void
  setMobileOpen: (value: boolean) => void
  closeMobile: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

const COLLAPSED_KEY = 'arena-ai-sidebar-collapsed'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState<boolean>(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  )
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((current) => {
      localStorage.setItem(COLLAPSED_KEY, String(!current))
      return !current
    })
  }, [])

  const closeMobile = React.useCallback(() => setMobileOpen(false), [])

  const value = React.useMemo(
    () => ({ collapsed, mobileOpen, setCollapsed, toggleCollapsed, setMobileOpen, closeMobile }),
    [collapsed, mobileOpen, toggleCollapsed, closeMobile],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
