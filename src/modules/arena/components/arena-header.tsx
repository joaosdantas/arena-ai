import { ArrowLeft, Building2 } from 'lucide-react'

import { NavLink } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { SidebarTrigger } from '@/components/layout/sidebar-trigger'
import { UserMenu } from '@/components/layout/user-menu'

export function ArenaHeader({ arenaName }: { arenaName?: string }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <BrandLogo className="md:hidden" />
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <Building2 className="text-muted-foreground size-4 shrink-0" />
        <span className="truncate text-sm font-medium">{arenaName ?? 'Painel da Arena'}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NavLink
          to="/dashboard"
          className="hover:bg-accent hover:text-accent-foreground text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Voltar ao app</span>
        </NavLink>
        <UserMenu />
      </div>
    </header>
  )
}
