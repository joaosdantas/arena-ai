import { Home, Plus, Trophy, User } from 'lucide-react'

import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { appPaths } from '@/routes/paths'

interface MobileNavItemProps {
  to: string
  label: string
  icon: typeof Home
  end?: boolean
}

function MobileNavItem({ to, label, icon: Icon, end }: MobileNavItemProps) {
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

export function MobileNavigation() {
  return (
    <nav
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-4 items-stretch">
        <MobileNavItem to={appPaths.dashboard} label="Home" icon={Home} end />
        <MobileNavItem to={appPaths.matches} label="Partidas" icon={Trophy} />
        <NavLink
          to={appPaths.matchesNew}
          className="relative flex flex-col items-center justify-center py-1"
          aria-label="Nova partida"
        >
          <span className="bg-brand text-brand-foreground shadow-brand/40 flex size-12 -translate-y-4 items-center justify-center rounded-full shadow-lg">
            <Plus className="size-6" strokeWidth={2.5} />
          </span>
          <span className="-mt-3.5 text-[11px] font-semibold text-muted-foreground">
            Nova partida
          </span>
        </NavLink>
        <MobileNavItem to={appPaths.profile} label="Perfil" icon={User} />
      </div>
    </nav>
  )
}
