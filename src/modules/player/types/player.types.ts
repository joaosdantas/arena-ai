import type { MatchStatus } from '@/modules/matches/types/match.types'
import type { VideoStatus } from '@/modules/videos/types/video.types'

export interface PlayerMatch {
  id: string
  title: string
  sport: string
  status: MatchStatus
  isPublic: boolean
  arenaId: string | null
  arenaName: string | null
  arenaCity: string | null
  courtName: string | null
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  description: string | null
  thumbnailUrl: string | null
  videoCount: number
  readyVideoCount: number
  createdAt: string
}

export interface PlayerVideo {
  id: string
  matchId: string
  status: VideoStatus
  url: string | null
  storagePath: string | null
  thumbnailUrl: string | null
  previewUrl: string | null
  duration: number | null
  cameraName: string | null
  createdAt: string
  matchTitle: string | null
  sport: string | null
  scheduledAt: string | null
  arenaName: string | null
  courtName: string | null
}

export interface PlayerVideoView {
  videoId: string
  status: VideoStatus
  duration: number | null
  thumbnailUrl: string | null
  playbackUrl: string | null
  matchId: string | null
  matchTitle: string | null
  sport: string | null
  scheduledAt: string | null
  arenaName: string | null
  courtName: string | null
}
