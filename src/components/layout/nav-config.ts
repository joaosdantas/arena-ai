import { LayoutDashboard, Trophy, User } from 'lucide-react'

import { appPaths } from '@/routes/paths'

import type { NavigationGroup } from '@/types/navigation'

export const mainNavigation: NavigationGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        label: 'Dashboard',
        href: appPaths.dashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'Partidas',
        href: appPaths.matches,
        icon: Trophy,
      },
    ],
  },
]

export const accountNavigation: NavigationGroup[] = [
  {
    items: [
      {
        label: 'Perfil',
        href: appPaths.profile,
        icon: User,
      },
    ],
  },
]
