import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { matchKeys } from '@/modules/matches/hooks/use-matches'
import { videoService } from '@/modules/videos/services/video.service'
import type { Video } from '@/modules/videos/types/video.types'

export const videoKeys = {
  all: ['videos'] as const,
  byMatch: (matchId: string) => [...videoKeys.all, 'match', matchId] as const,
  detail: (id: string) => [...videoKeys.all, 'detail', id] as const,
}

export function useMatchVideo(matchId: string) {
  return useQuery({
    queryKey: videoKeys.byMatch(matchId),
    queryFn: () => videoService.getVideoByMatch(matchId),
    enabled: Boolean(matchId),
  })
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: () => videoService.getVideoById(id),
    enabled: Boolean(id),
  })
}

export function useDeleteVideo(matchId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (video: Video) => videoService.deleteVideo(video),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: videoKeys.all })
      if (matchId) {
        void queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) })
      }
    },
  })
}
