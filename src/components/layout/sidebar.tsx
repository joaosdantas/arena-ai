import type { ReactNode } from 'react'

import { useSidebar } from '@/components/layout/sidebar-context'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

import { cn } from '@/lib/utils'

import type { NavigationGroup } from '@/types/navigation'

interface SidebarProps {
  groups: NavigationGroup[]
  header?: ReactNode
  footer?: ReactNode
}

export function Sidebar({ groups, header, footer }: SidebarProps) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar()

  const content = (
    <>
      {header}
      <SidebarNav groups={groups} onNavigate={closeMobile} />
      {footer}
    </>
  )

  return (
    <>
      <aside
        data-collapsed={collapsed}
        className={cn(
          'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-dvh w-64 shrink-0 flex-col border-r md:flex',
          collapsed && 'w-16',
          'transition-[width] duration-200',
        )}
      >
        {content}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={closeMobile}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">{content}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function SidebarFooter({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn('mt-auto border-t p-3', collapsed && 'flex flex-col items-center gap-2')}>
      {children}
    </div>
  )
}
