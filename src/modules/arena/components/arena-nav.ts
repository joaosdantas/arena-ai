import { Camera, LayoutDashboard, LayoutGrid, Settings, Trophy, Video } from 'lucide-react'

import { appPaths } from '@/routes/paths'

import type { NavigationGroup } from '@/types/navigation'

export const arenaNavigation: NavigationGroup[] = [
  {
    label: 'Operação',
    items: [
      {
        label: 'Dashboard',
        href: appPaths.arena,
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: 'Quadras',
        href: appPaths.arenaCourts,
        icon: LayoutGrid,
      },
      {
        label: 'Dispositivos',
        href: appPaths.arenaDevices,
        icon: Camera,
      },
      {
        label: 'Sessões',
        href: appPaths.arenaSessions,
        icon: Video,
      },
      {
        label: 'Partidas',
        href: appPaths.matches,
        icon: Trophy,
      },
    ],
  },
  {
    label: 'Arena',
    items: [
      {
        label: 'Configurações',
        href: appPaths.arenaSettings,
        icon: Settings,
      },
    ],
  },
]
