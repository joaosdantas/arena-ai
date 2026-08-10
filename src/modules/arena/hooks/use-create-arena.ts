import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/contexts/AuthContext'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { arenaDashboardService } from '@/modules/arena/services/arena-dashboard.service'
import type { NewArenaInput } from '@/modules/arena/types/arena-dashboard.types'

export function useCreateArena() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (input: NewArenaInput) => {
      if (!user) throw new Error('Usuário não autenticado.')
      return arenaDashboardService.createArenaAndStructure(input, user.id)
    },
    onSuccess: (arena) => {
      void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.all })
      if (user) {
        queryClient.setQueryData(arenaDashboardKeys.arenaByOwner(user.id), arena)
      }
    },
  })
}
