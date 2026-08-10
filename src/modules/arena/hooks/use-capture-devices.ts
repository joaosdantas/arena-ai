import { useQuery } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'

export function useCaptureDevices(arenaId: string | undefined) {
  return useQuery({
    queryKey: arenaDashboardKeys.devices(arenaId ?? ''),
    queryFn: () => {
      if (!arenaId) return Promise.resolve([])
      return arenaDashboardService.getCaptureDevices(arenaId)
    },
    enabled: Boolean(arenaId),
    refetchInterval: 15_000,
  })
}
