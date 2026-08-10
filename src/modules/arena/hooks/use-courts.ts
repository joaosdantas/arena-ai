import { useQuery } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'

export function useCourts(arenaId: string | undefined) {
  return useQuery({
    queryKey: arenaDashboardKeys.courts(arenaId ?? ''),
    queryFn: () => {
      if (!arenaId) return Promise.resolve([])
      return arenaDashboardService.getCourts(arenaId)
    },
    enabled: Boolean(arenaId),
  })
}
