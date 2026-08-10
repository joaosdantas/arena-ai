import { Clapperboard, Trophy, User } from 'lucide-react'

import { NavLink, Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'

import { cn } from '@/lib/utils'

import { appPaths } from '@/routes/paths'

interface PlayerNavItemProps {
  to: string
  label: string
  icon: typeof Trophy
  end?: boolean
}

function PlayerNavItem({ to, label, icon: Icon, end }: PlayerNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-5" strokeWidth={2.2} />
      <span>{label}</span>
    </NavLink>
  )
}

export function PlayerLayout() {
  return (
    <div className="bg-muted/30 flex min-h-dvh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <NavLink to={appPaths.player} aria-label="Arena AI">
            <BrandLogo />
          </NavLink>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Clapperboard className="text-primary size-4" />
            Minhas partidas
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6 pb-28">
        <Outlet />
      </main>

      <nav
        className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
        aria-label="Navegação do jogador"
      >
        <div className="mx-auto grid w-full max-w-md grid-cols-2 items-stretch">
          <PlayerNavItem to={appPaths.player} label="Minhas partidas" icon={Trophy} end />
          <PlayerNavItem to={appPaths.profile} label="Perfil" icon={User} />
        </div>
      </nav>
    </div>
  )
}
