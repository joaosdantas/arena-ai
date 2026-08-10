import { useQuery } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'

export function useArenaDashboard(arenaId: string | undefined) {
  return useQuery({
    queryKey: arenaDashboardKeys.summary(arenaId ?? ''),
    queryFn: () => {
      if (!arenaId) return Promise.resolve(null)
      return arenaDashboardService.getSummary(arenaId)
    },
    enabled: Boolean(arenaId),
  })
}
