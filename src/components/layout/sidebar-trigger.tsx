import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { useSidebar } from '@/components/layout/sidebar-context'
import { Button } from '@/components/ui/button'

import { useIsMobile } from '@/hooks'

import { cn } from '@/lib/utils'

export function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Abrir menu"
        onClick={() => setMobileOpen(true)}
        className={cn('md:hidden', className)}
      >
        <PanelLeftOpen className="size-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      onClick={toggleCollapsed}
      className={cn('hidden md:inline-flex', className)}
    >
      {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
    </Button>
  )
}
