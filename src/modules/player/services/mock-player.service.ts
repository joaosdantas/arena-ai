import { mockMatchStore } from '@/modules/matches/services/mock-matches'
import { readMockSession } from '@/modules/auth/services/mock-session'
import type { PlayerMatch, PlayerVideo, PlayerVideoView } from '@/modules/player/types/player.types'

const FIXTURE_MATCH_ID = 'player-mock-match-arena-xp'
const FIXTURE_VIDEO_READY_ID = 'player-mock-video-ready'
const FIXTURE_VIDEO_PROCESSING_ID = 'player-mock-video-processing'

export const FIXTURE_SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBigEscapes.mp4'

const FIXTURE_THUMBNAIL_URL = 'https://picsum.photos/seed/arena-ai-football/640/360'

function mockOwnerId(): string {
  return readMockSession()?.id ?? 'mock-player'
}

function buildFixtureMatch(): PlayerMatch {
  const now = Date.now()
  return {
    id: FIXTURE_MATCH_ID,
    title: 'Sessão de teste — Arena XP',
    sport: 'football',
    status: 'ready',
    isPublic: true,
    arenaId: 'mock-arena-xp',
    arenaName: 'Arena XP',
    arenaCity: 'São Paulo',
    courtName: 'Quadra 1',
    scheduledAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    finishedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    description:
      'Partida fictícia de demonstração do módulo Player: futebol na Quadra 1 da Arena XP.',
    thumbnailUrl: FIXTURE_THUMBNAIL_URL,
    videoCount: 2,
    readyVideoCount: 1,
    createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function buildFixtureVideos(): PlayerVideo[] {
  const now = Date.now()
  return [
    {
      id: FIXTURE_VIDEO_READY_ID,
      matchId: FIXTURE_MATCH_ID,
      status: 'ready',
      url: FIXTURE_SAMPLE_VIDEO_URL,
      storagePath: null,
      thumbnailUrl: FIXTURE_THUMBNAIL_URL,
      previewUrl: null,
      duration: 60,
      recordingStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      recordingEndedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 60_000).toISOString(),
      timelineOffsetMs: 0,
      sessionStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      cameraName: 'Camera Lateral Principal',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      matchTitle: 'Sessão de teste — Arena XP',
      sport: 'football',
      scheduledAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      arenaName: 'Arena XP',
      courtName: 'Quadra 1',
    },
    {
      id: FIXTURE_VIDEO_PROCESSING_ID,
      matchId: FIXTURE_MATCH_ID,
      status: 'processing',
      url: null,
      storagePath: null,
      thumbnailUrl: null,
      previewUrl: null,
      duration: 59,
      recordingStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 350).toISOString(),
      recordingEndedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 59_350).toISOString(),
      timelineOffsetMs: 350,
      sessionStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      cameraName: 'Camera Fundo Principal',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      matchTitle: 'Sessão de teste — Arena XP',
      sport: 'football',
      scheduledAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      arenaName: 'Arena XP',
      courtName: 'Quadra 1',
    },
    {
      id: 'player-mock-video-third-camera',
      matchId: FIXTURE_MATCH_ID,
      status: 'processing',
      url: null,
      storagePath: null,
      thumbnailUrl: null,
      previewUrl: null,
      duration: 58,
      recordingStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 1200).toISOString(),
      recordingEndedAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 59_200).toISOString(),
      timelineOffsetMs: 1200,
      sessionStartedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      cameraName: 'Camera Fundo',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 1200).toISOString(),
      matchTitle: 'Sessão de teste — Arena XP',
      sport: 'football',
      scheduledAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      arenaName: 'Arena XP',
      courtName: 'Quadra 1',
    },
  ]
}

function toPlayerMatch(match: ReturnType<typeof mockMatchStore.list>[number]): PlayerMatch {
  return {
    id: match.id,
    title: match.title,
    sport: match.sport,
    status: match.status,
    isPublic: match.isPublic,
    arenaId: match.arenaId,
    arenaName: match.arena?.name ?? null,
    arenaCity: match.arena?.city ?? null,
    courtName: null,
    scheduledAt: match.scheduledAt,
    startedAt: match.startedAt,
    finishedAt: match.finishedAt,
    description: match.description,
    thumbnailUrl: match.thumbnailUrl,
    videoCount: 0,
    readyVideoCount: 0,
    createdAt: match.createdAt,
  }
}

export const mockPlayerService = {
  listMatches(): PlayerMatch[] {
    const ownerId = mockOwnerId()
    const fixture = buildFixtureMatch()
    const existing = mockMatchStore
      .list(ownerId)
      .map(toPlayerMatch)
      .filter((match) => match.id !== FIXTURE_MATCH_ID)

    return [fixture, ...existing].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getMatch(id: string): PlayerMatch | null {
    if (id === FIXTURE_MATCH_ID) return buildFixtureMatch()
    const match = mockMatchStore.byId(id)
    return match ? toPlayerMatch(match) : null
  },

  listMatchVideos(matchId: string): PlayerVideo[] {
    if (matchId === FIXTURE_MATCH_ID) return buildFixtureVideos()
    return []
  },

  getVideo(id: string): PlayerVideo | null {
    const videos = buildFixtureVideos()
    return videos.find((video) => video.id === id) ?? null
  },

  getPublicVideo(videoId: string): PlayerVideoView | null {
    const video = buildFixtureVideos().find((item) => item.id === videoId)
    if (!video) return null
    return {
      videoId: video.id,
      status: video.status,
      duration: video.duration,
      thumbnailUrl: video.thumbnailUrl,
      playbackUrl: video.status === 'ready' ? video.url : null,
      matchId: video.matchId,
      matchTitle: video.matchTitle,
      sport: video.sport,
      scheduledAt: video.scheduledAt,
      arenaName: video.arenaName,
      courtName: video.courtName,
    }
  },
}
