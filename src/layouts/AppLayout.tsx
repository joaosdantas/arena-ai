import { Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { Header } from '@/components/layout/header'
import { MobileNavigation } from '@/components/layout/mobile-navigation'
import { mainNavigation } from '@/components/layout/nav-config'
import { Sidebar, SidebarFooter } from '@/components/layout/sidebar'
import { SidebarProvider, useSidebar } from '@/components/layout/sidebar-context'
import { SidebarCollapseButton, SidebarTitle } from '@/components/layout/sidebar-nav'

function AppSidebar() {
  const { collapsed } = useSidebar()

  return (
    <Sidebar
      groups={mainNavigation}
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

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-28 md:p-6 md:pb-8 lg:p-8">
              <Outlet />
            </div>
          </main>
          <MobileNavigation />
        </div>
      </div>
    </SidebarProvider>
  )
}
