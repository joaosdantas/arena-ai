import { mockPlayerService } from '@/modules/player/services/mock-player.service'
import type {
  PlayerMatch,
  PlayerVideo,
  PlayerVideoView,
} from '@/modules/player/types/player.types'
import { env } from '@/lib/env'
import { videosService } from '@/services/videos.service'
import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type { MatchStatus } from '@/modules/matches/types/match.types'
import type { VideoStatus } from '@/modules/videos/types/video.types'

interface PlayerMatchRow {
  id: string
  title: string
  sport: string
  status: MatchStatus
  is_public: boolean
  arena_id: string | null
  description: string | null
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  arena: { id: string; name: string; city: string | null } | null
  session: { court: { name: string } | null } | null
}

interface PlayerVideoRow {
  id: string
  match_id: string | null
  processing_status: VideoStatus
  original_url: string
  thumbnail_url: string | null
  preview_url: string | null
  duration: number | null
  recording_started_at: string | null
  recording_ended_at: string | null
  timeline_offset_ms: number | null
  created_at: string
  match: {
    id: string
    title: string
    sport: string
    scheduled_at: string | null
    arena: { id: string; name: string; city: string | null } | null
  } | null
  session: { started_at?: string | null; court: { name: string } | null } | null
  capture_device: { name: string } | null
}

function resolveThumbnailUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  if (isSupabaseConfigured() && env.VITE_SUPABASE_URL) {
    return `${env.VITE_SUPABASE_URL}/storage/v1/object/public/${path.replace(/^\/+/, '')}`
  }
  return null
}

function mapPlayerMatch(row: PlayerMatchRow): PlayerMatch {
  return {
    id: row.id,
    title: row.title,
    sport: row.sport,
    status: row.status,
    isPublic: row.is_public,
    arenaId: row.arena_id,
    arenaName: row.arena?.name ?? null,
    arenaCity: row.arena?.city ?? null,
    courtName: row.session?.court?.name ?? null,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    description: row.description,
    thumbnailUrl: null,
    videoCount: 0,
    readyVideoCount: 0,
    createdAt: row.created_at,
  }
}

function mapPlayerVideo(row: PlayerVideoRow): PlayerVideo {
  return {
    id: row.id,
    matchId: row.match_id ?? '',
    status: row.processing_status,
    url: null,
    storagePath: row.original_url || null,
    thumbnailUrl: resolveThumbnailUrl(row.thumbnail_url),
    previewUrl: resolveThumbnailUrl(row.preview_url),
    duration: row.duration,
    recordingStartedAt: row.recording_started_at ?? null,
    recordingEndedAt: row.recording_ended_at ?? null,
    timelineOffsetMs: row.timeline_offset_ms ?? null,
    sessionStartedAt: row.session?.started_at ?? null,
    cameraName: row.capture_device?.name ?? null,
    createdAt: row.created_at,
    matchTitle: row.match?.title ?? null,
    sport: row.match?.sport ?? null,
    scheduledAt: row.match?.scheduled_at ?? null,
    arenaName: row.match?.arena?.name ?? null,
    courtName: row.session?.court?.name ?? null,
  }
}

export const playerService = {
  async getPlayerMatches(): Promise<PlayerMatch[]> {
    if (!isSupabaseConfigured()) {
      return mockPlayerService.listMatches()
    }

    const client = getSupabase()
    const { data: rows, error } = await client
      .from('matches')
      .select('*, arena:arenas(*), session:sessions(started_at,court:courts(name))')
      .order('created_at', { ascending: false })
      .returns<PlayerMatchRow[]>()

    if (error) throw error

    const matches = rows.map(mapPlayerMatch)
    if (matches.length === 0) return matches

    const matchIds = matches.map((match) => match.id)
    const { data: videoRows, error: videoError } = await client
      .from('videos')
      .select('id, match_id, processing_status, thumbnail_url')
      .in('match_id', matchIds)

    if (videoError) throw videoError

    const counts = new Map<string, { total: number; ready: number; thumbnail: string | null }>()
    for (const video of videoRows ?? []) {
      if (!video.match_id) continue
      const entry = counts.get(video.match_id) ?? { total: 0, ready: 0, thumbnail: null }
      entry.total += 1
      if (video.processing_status === 'ready') {
        entry.ready += 1
        entry.thumbnail ??= resolveThumbnailUrl(video.thumbnail_url)
      }
      counts.set(video.match_id, entry)
    }

    return matches.map((match) => {
      const summary = counts.get(match.id) ?? { total: 0, ready: 0, thumbnail: null }
      return {
        ...match,
        thumbnailUrl: summary.thumbnail,
        videoCount: summary.total,
        readyVideoCount: summary.ready,
      }
    })
  },

  async getPlayerMatch(id: string): Promise<PlayerMatch | null> {
    if (!isSupabaseConfigured()) {
      return mockPlayerService.getMatch(id)
    }

    const client = getSupabase()
    const { data: row, error } = await client
      .from('matches')
      .select('*, arena:arenas(*), session:sessions(court:courts(name))')
      .eq('id', id)
      .maybeSingle()
      .returns<PlayerMatchRow | null>()

    if (error) throw error
    if (!row) return null

    const match = mapPlayerMatch(row)
    const videos = await playerService.getPlayerMatchVideos(id)
    const readyVideos = videos.filter((video) => video.status === 'ready')

    return {
      ...match,
      thumbnailUrl: readyVideos[0]?.thumbnailUrl ?? match.thumbnailUrl,
      videoCount: videos.length,
      readyVideoCount: readyVideos.length,
    }
  },

  async getPlayerMatchVideos(matchId: string): Promise<PlayerVideo[]> {
    if (!isSupabaseConfigured()) {
      return mockPlayerService.listMatchVideos(matchId)
    }

    const client = getSupabase()
    const { data: rows, error } = await client
      .from('videos')
      .select(
        '*, match:matches(*, arena:arenas(*)), session:sessions(started_at,court:courts(name)), capture_device:capture_devices(name)',
      )
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .returns<PlayerVideoRow[]>()

    if (error) throw error

    return Promise.all(
      rows.map(async (row) => {
        const video = mapPlayerVideo(row)
        if (row.original_url) {
          video.url = await videosService.getSignedUrl(row.original_url)
        }
        return video
      }),
    )
  },

  async getPlayerVideo(id: string): Promise<PlayerVideo | null> {
    if (!isSupabaseConfigured()) {
      return mockPlayerService.getVideo(id)
    }

    const client = getSupabase()
    const { data: row, error } = await client
      .from('videos')
      .select(
        '*, match:matches(*, arena:arenas(*)), session:sessions(started_at,court:courts(name)), capture_device:capture_devices(name)',
      )
      .eq('id', id)
      .maybeSingle()
      .returns<PlayerVideoRow | null>()

    if (error) throw error
    if (!row) return null

    const video = mapPlayerVideo(row)
    if (row.original_url && video.status === 'ready') {
      video.url = await videosService.getSignedUrl(row.original_url)
    }
    return video
  },

  async getPublicVideo(videoId: string): Promise<PlayerVideoView | null> {
    if (!isSupabaseConfigured()) {
      return mockPlayerService.getPublicVideo(videoId)
    }

    const { data, error } = await getSupabase().rpc('get_public_video', {
      p_video_id: videoId,
    })

    if (error) throw error
    const row = data?.[0]
    if (!row) return null

    return {
      videoId: row.video_id,
      status: row.processing_status as VideoStatus,
      duration: row.duration,
      thumbnailUrl: resolveThumbnailUrl(row.thumbnail_url),
      playbackUrl:
        row.original_url && row.processing_status === 'ready'
          ? await videosService.getSignedUrl(row.original_url)
          : null,
      matchId: row.match_id,
      matchTitle: row.match_title,
      sport: row.sport,
      scheduledAt: row.scheduled_at,
      arenaName: row.arena_name,
      courtName: row.court_name,
    }
  },
}
