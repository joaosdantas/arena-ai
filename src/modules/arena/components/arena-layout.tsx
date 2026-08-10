import { Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { Sidebar, SidebarFooter } from '@/components/layout/sidebar'
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context'
import { SidebarCollapseButton, SidebarTitle } from '@/components/layout/sidebar-nav'

import { ArenaHeader } from '@/modules/arena/components/arena-header'
import { arenaNavigation } from '@/modules/arena/components/arena-nav'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

function ArenaSidebar() {
  const { collapsed } = useSidebar()

  return (
    <Sidebar
      groups={arenaNavigation}
      header={
        <SidebarTitle>
          <BrandLogo collapsed={collapsed} />
        </SidebarTitle>
      }
      footer={
        <SidebarFooter>
          <SidebarCollapseButton />
        </SidebarFooter>
      }
    />
  )
}

export function ArenaLayout() {
  const { data: arena } = useCurrentArena()

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <ArenaSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ArenaHeader arenaName={arena?.name} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 md:p-6 md:pb-8 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
