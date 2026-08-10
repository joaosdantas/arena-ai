import { useQuery } from '@tanstack/react-query'

import { arenasService } from '@/services/arenas.service'

export const arenaKeys = {
  all: ['arenas'] as const,
  lists: () => [...arenaKeys.all, 'list'] as const,
  list: () => [...arenaKeys.lists()] as const,
}

export function useArenas() {
  return useQuery({
    queryKey: arenaKeys.list(),
    queryFn: () => arenasService.getArenas(),
  })
}
