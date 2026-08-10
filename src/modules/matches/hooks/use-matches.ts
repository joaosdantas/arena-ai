import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { matchService } from '@/modules/matches/services/match.service'
import type { MatchFormData } from '@/modules/matches/types/match.types'
import type { MatchStatus } from '@/modules/matches/types/match.types'

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...matchKeys.lists(), filters] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
}

export function useMatches() {
  return useQuery({
    queryKey: matchKeys.list('mine'),
    queryFn: () => matchService.getMyMatches(),
  })
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: () => matchService.getMatchById(id),
    enabled: Boolean(id),
  })
}

export function useCreateMatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MatchFormData) => matchService.createMatch(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}

export function useUpdateMatch(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<MatchFormData>) => matchService.updateMatch(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: matchKeys.detail(id) })
    },
  })
}

export function useUpdateMatchStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: MatchStatus) => matchService.updateMatchStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: matchKeys.detail(id) })
    },
  })
}

export function useDeleteMatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => matchService.deleteMatch(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}
