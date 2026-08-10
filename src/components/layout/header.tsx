import { BrandLogo } from '@/components/common/brand-logo'
import { SidebarTrigger } from '@/components/layout/sidebar-trigger'
import { UserMenu } from '@/components/layout/user-menu'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <span className="md:hidden">
        <BrandLogo />
      </span>
      <span className="hidden md:inline-flex">
        <SidebarTrigger />
      </span>

      <div className="ml-auto flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  )
}
