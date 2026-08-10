import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/contexts/AuthContext'

import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'

export const arenaDashboardKeys = {
  all: ['arena-dashboard'] as const,
  arenaByOwner: (ownerId: string) => [...arenaDashboardKeys.all, 'arena', ownerId] as const,
  summary: (arenaId: string) => [...arenaDashboardKeys.all, 'summary', arenaId] as const,
  courts: (arenaId: string) => [...arenaDashboardKeys.all, 'courts', arenaId] as const,
  devices: (arenaId: string) => [...arenaDashboardKeys.all, 'devices', arenaId] as const,
  sessions: (arenaId: string) => [...arenaDashboardKeys.all, 'sessions', arenaId] as const,
  session: (sessionId: string) => [...arenaDashboardKeys.all, 'session', sessionId] as const,
}

export function useCurrentArena() {
  const { user } = useAuth()

  return useQuery({
    queryKey: arenaDashboardKeys.arenaByOwner(user?.id ?? ''),
    queryFn: () => {
      if (!user) return Promise.resolve(null)
      return arenaDashboardService.getArenaByOwner(user.id)
    },
    enabled: Boolean(user?.id),
  })
}
