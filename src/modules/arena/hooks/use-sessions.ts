import { useQuery } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'

export function useSessions(arenaId: string | undefined) {
  return useQuery({
    queryKey: arenaDashboardKeys.sessions(arenaId ?? ''),
    queryFn: () => {
      if (!arenaId) return Promise.resolve([])
      return arenaDashboardService.getSessions(arenaId)
    },
    enabled: Boolean(arenaId),
  })
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: arenaDashboardKeys.session(sessionId ?? ''),
    queryFn: () => {
      if (!sessionId) return Promise.resolve(null)
      return arenaDashboardService.getSession(sessionId)
    },
    enabled: Boolean(sessionId),
    refetchInterval: 10_000,
  })
}
