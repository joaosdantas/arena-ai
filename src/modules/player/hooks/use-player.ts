import { useQuery } from '@tanstack/react-query'

import { playerService } from '@/modules/player/services/player.service'
import type { PlayerMatch, PlayerVideo } from '@/modules/player/types/player.types'

export const playerKeys = {
  all: ['player'] as const,
  matches: () => [...playerKeys.all, 'matches'] as const,
  match: (id: string) => [...playerKeys.all, 'match', id] as const,
  matchVideos: (id: string) => [...playerKeys.all, 'match-videos', id] as const,
  video: (id: string) => [...playerKeys.all, 'video', id] as const,
  publicVideo: (id: string) => [...playerKeys.all, 'public-video', id] as const,
}

const PROCESSING_STATUSES = ['pending', 'uploading', 'processing']

interface StatusLike {
  status: string
}

function shouldPollMatch(match: PlayerMatch | null | undefined): boolean {
  return Boolean(
    match && ['created', 'recording', 'uploading', 'processing'].includes(match.status),
  )
}

function shouldPollVideos(videos: PlayerVideo[] | null | undefined): boolean {
  return Boolean(videos && videos.some((video) => PROCESSING_STATUSES.includes(video.status)))
}

function shouldPollVideo(video: PlayerVideo | null | undefined): boolean {
  return Boolean(video && PROCESSING_STATUSES.includes(video.status))
}

export function usePlayerMatches() {
  return useQuery({
    queryKey: playerKeys.matches(),
    queryFn: () => playerService.getPlayerMatches(),
  })
}

export function usePlayerMatch(id: string) {
  return useQuery({
    queryKey: playerKeys.match(id),
    queryFn: () => playerService.getPlayerMatch(id),
    enabled: Boolean(id),
    refetchInterval: (query) => (shouldPollMatch(query.state.data as PlayerMatch | null) ? 10_000 : false),
  })
}

export function usePlayerMatchVideos(matchId: string) {
  return useQuery({
    queryKey: playerKeys.matchVideos(matchId),
    queryFn: () => playerService.getPlayerMatchVideos(matchId),
    enabled: Boolean(matchId),
    refetchInterval: (query) =>
      shouldPollVideos(query.state.data as PlayerVideo[] | null) ? 10_000 : false,
  })
}

export function usePlayerVideo(id: string) {
  return useQuery({
    queryKey: playerKeys.video(id),
    queryFn: () => playerService.getPlayerVideo(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      shouldPollVideo(query.state.data as PlayerVideo | null) ? 10_000 : false,
  })
}

export function usePublicVideo(videoId: string) {
  return useQuery({
    queryKey: playerKeys.publicVideo(videoId),
    queryFn: () => playerService.getPublicVideo(videoId),
    enabled: Boolean(videoId),
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data as StatusLike | null | undefined
      return data && PROCESSING_STATUSES.includes(data.status) ? 5_000 : false
    },
  })
}
