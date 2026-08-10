import * as React from 'react'

import { ChevronRight } from 'lucide-react'

import { NavLink } from 'react-router-dom'

import { useSidebar } from '@/components/layout/sidebar-context'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

import type { NavigationGroup } from '@/types/navigation'

interface SidebarNavProps {
  groups: NavigationGroup[]
  onNavigate?: () => void
}

export function SidebarNav({ groups, onNavigate }: SidebarNavProps) {
  const { collapsed } = useSidebar()

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
      {groups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex} className="space-y-1">
          {group.label && !collapsed ? (
            <p className="text-muted-foreground px-3 pb-1 text-xs font-medium uppercase tracking-wider">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                  collapsed && 'justify-center px-2',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

export function SidebarCollapseButton() {
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCollapsed}
      className="w-full justify-between px-3 text-muted-foreground"
      aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
    >
      {!collapsed ? <span className="text-sm">Recolher</span> : null}
      <ChevronRight
        className={cn('size-4 transition-transform', collapsed ? 'rotate-180' : 'rotate-0')}
      />
    </Button>
  )
}

export function SidebarTitle({ className, ...props }: React.ComponentProps<'div'>) {
  const { collapsed } = useSidebar()
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-2 border-b px-4',
        collapsed && 'justify-center px-2',
        className,
      )}
      {...props}
    />
  )
}
