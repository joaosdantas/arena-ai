import type { ComponentType } from 'react'

export interface NavigationItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

export interface NavigationGroup {
  label?: string
  items: NavigationItem[]
}
