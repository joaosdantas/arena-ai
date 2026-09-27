import { buildQrCode, mockArenaStore } from '@/modules/arena/services/mock-arena-dashboard'
import type {
  ArenaDashboardSummary,
  ArenaMatchSummary,
  CaptureDeviceView,
  CourtView,
  NewArenaInput,
  SessionDetail,
  SessionVideoView,
  SessionView,
} from '@/modules/arena/types/arena-dashboard.types'

import { arenaService } from '@/services/arena.service'
import { captureDeviceService } from '@/services/capture-device.service'
import { captureVideoService } from '@/services/capture-video.service'
import { courtService } from '@/services/court.service'
import { sessionService } from '@/services/session.service'
import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type { Arena } from '@/types/domain'
import type { VideoRow } from '@/types/videos'

import { buildCapturePairingUrl, deriveCapturePresence } from '@/utils/capture'

function isToday(value: string | null | undefined): boolean {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function buildSummary(
  arenaId: string,
  parts: Omit<ArenaDashboardSummary, 'arenaId'>,
): ArenaDashboardSummary {
  return { arenaId, ...parts }
}

interface DeviceRow {
  id: string
  court_id: string
  name: string
  qr_code: string
  pairing_token: string
  paired: boolean
  position: string | null
  height: number | null
  angle: number | null
  status: string
  last_seen: string | null
}

interface SessionRow {
  id: string
  court_id: string
  started_at: string | null
  ended_at: string | null
  status: string
  created_at: string
}

function toDeviceView(device: DeviceRow, courtName: string): CaptureDeviceView {
  return {
    id: device.id,
    courtId: device.court_id,
    courtName,
    name: device.name,
    qrCode: device.qr_code,
    pairingToken: device.pairing_token,
    pairingUrl: buildCapturePairingUrl(device.pairing_token),
    paired: device.paired,
    position: device.position ?? null,
    height: device.height ?? null,
    angle: device.angle ?? null,
    status: device.status as CaptureDeviceView['status'],
    presence: deriveCapturePresence(device.last_seen),
    lastSeen: device.last_seen ?? null,
  }
}

function toSessionView(session: SessionRow, courtName: string): SessionView {
  return {
    id: session.id,
    courtId: session.court_id,
    courtName,
    startedAt: session.started_at ?? null,
    endedAt: session.ended_at ?? null,
    status: session.status as SessionView['status'],
    createdAt: session.created_at,
  }
}

function toSessionVideoView(video: VideoRow): SessionVideoView {
  return {
    id: video.id,
    sessionId: video.session_id,
    captureDeviceId: video.capture_device_id,
    matchId: video.match_id,
    status: video.processing_status,
    duration: video.duration,
    recordingStartedAt: video.recording_started_at,
    recordingEndedAt: video.recording_ended_at,
    timelineOffsetMs: video.timeline_offset_ms,
    cameraName: null,
    thumbnailUrl: video.thumbnail_url,
    previewUrl: video.preview_url,
    mimeType: video.mime_type,
    fileSize: video.file_size,
    createdAt: video.created_at,
  }
}

function isPlayedMatch(status: string): boolean {
  return status !== 'created'
}

async function getRealMatches(arenaId: string): Promise<{ id: string; status: string }[]> {
  const { data, error } = await getSupabase()
    .from('matches')
    .select('id,status')
    .eq('arena_id', arenaId)
  if (error) throw error
  return data
}

async function countRealProcessedVideos(matchIds: string[]): Promise<number> {
  if (matchIds.length === 0) return 0
  const { data, error } = await getSupabase()
    .from('videos')
    .select('processing_status')
    .in('match_id', matchIds)
  if (error) throw error
  return data.filter((video) => video.processing_status === 'ready').length
}

async function countRealProcessedSessionVideos(sessionIds: string[]): Promise<number> {
  if (sessionIds.length === 0) return 0
  const { data, error } = await getSupabase()
    .from('videos')
    .select('processing_status')
    .in('session_id', sessionIds)
  if (error) throw error
  return data.filter((video) => video.processing_status === 'ready').length
}

export const arenaDashboardService = {
  async getArenaByOwner(ownerId: string): Promise<Arena | null> {
    if (!isSupabaseConfigured()) return mockArenaStore.getArenaByOwner(ownerId)
    const { data, error } = await getSupabase()
      .from('arenas')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getCourts(arenaId: string): Promise<CourtView[]> {
    const deviceRows = await this.getRawDevices(arenaId)

    let courts: { id: string; name: string; sport: string | null; status: string }[]
    if (!isSupabaseConfigured()) {
      courts = mockArenaStore.getByArenaId(arenaId)?.courts ?? []
    } else {
      courts = await courtService.listByArena(arenaId)
    }

    return courts.map((court) => ({
      id: court.id,
      name: court.name,
      sport: court.sport ?? null,
      status: court.status === 'inactive' ? ('inactive' as const) : ('active' as const),
      deviceCount: deviceRows.filter((device) => device.court_id === court.id).length,
    }))
  },

  async getRawDevices(arenaId: string): Promise<DeviceRow[]> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.getByArenaId(arenaId)?.devices ?? []
    }
    const courts = await courtService.listByArena(arenaId)
    const courtIds = new Set(courts.map((court) => court.id))
    const devices = await captureDeviceService.list()
    return devices.filter((device) => courtIds.has(device.court_id))
  },

  async getCaptureDevices(arenaId: string): Promise<CaptureDeviceView[]> {
    if (!isSupabaseConfigured()) {
      const data = mockArenaStore.getByArenaId(arenaId)
      if (!data) return []
      const courtNameById = new Map(data.courts.map((court) => [court.id, court.name]))
      return data.devices.map((device) =>
        toDeviceView(device, courtNameById.get(device.court_id) ?? '—'),
      )
    }

    const courts = await courtService.listByArena(arenaId)
    const courtNameById = new Map(courts.map((court) => [court.id, court.name]))
    const devices = await captureDeviceService.list()
    const courtIds = new Set(courts.map((court) => court.id))
    return devices
      .filter((device) => courtIds.has(device.court_id))
      .map((device) => toDeviceView(device, courtNameById.get(device.court_id) ?? '—'))
  },

  async getSessions(arenaId: string): Promise<SessionView[]> {
    if (!isSupabaseConfigured()) {
      const data = mockArenaStore.getByArenaId(arenaId)
      if (!data) return []
      const courtNameById = new Map(data.courts.map((court) => [court.id, court.name]))
      return data.sessions.map((session) =>
        toSessionView(session, courtNameById.get(session.court_id) ?? '—'),
      )
    }

    const courts = await courtService.listByArena(arenaId)
    const courtNameById = new Map(courts.map((court) => [court.id, court.name]))
    const sessions = await sessionService.list()
    const courtIds = new Set(courts.map((court) => court.id))
    return sessions
      .filter((session) => courtIds.has(session.court_id))
      .map((session) => toSessionView(session, courtNameById.get(session.court_id) ?? '—'))
  },

  async getSession(sessionId: string): Promise<SessionDetail | null> {
    let session: SessionView | null
    let devices: CaptureDeviceView[]
    let matches: ArenaMatchSummary[]
    let videos: SessionVideoView[]

    if (!isSupabaseConfigured()) {
      const data = mockArenaStore.getBySessionId(sessionId)
      if (!data) return null
      const raw = data.sessions.find((item) => item.id === sessionId)
      if (!raw) return null
      const court = data.courts.find((item) => item.id === raw.court_id)
      session = toSessionView(raw, court?.name ?? '—')
      devices = data.devices
        .filter((device) => device.court_id === raw.court_id)
        .map((device) => toDeviceView(device, court?.name ?? '—'))
      matches = data.matches
        .filter((match) => match.sessionId === sessionId)
        .map((match) => ({
          id: match.id,
          title: match.title,
          sport: match.sport,
          status: match.status,
        }))
      videos = mockArenaStore
        .getVideosBySession(sessionId)
        .map((video) => {
          const mapped = toSessionVideoView(video as unknown as VideoRow)
          return { ...mapped, cameraName: devices.find((device) => device.id === video.capture_device_id)?.name ?? null }
        })
    } else {
      const raw = await sessionService.get(sessionId)
      if (!raw) return null
      const courts = await courtService.list()
      const court = courts.find((item) => item.id === raw.court_id)
      session = toSessionView(raw, court?.name ?? '—')
      const rawDevices = await captureDeviceService.listByCourt(raw.court_id)
      devices = rawDevices.map((device) => toDeviceView(device, court?.name ?? '—'))
      const { data: rawMatches, error } = await getSupabase()
        .from('matches')
        .select('id,title,sport,status')
        .eq('session_id', sessionId)
      if (error) throw error
      matches = rawMatches.map((match) => ({
        id: match.id,
        title: match.title,
        sport: match.sport ?? '',
        status: match.status,
      }))
      videos = (await captureVideoService.getVideosBySession(sessionId)).map((video) =>
        ({
          ...toSessionVideoView(video),
          cameraName: rawDevices.find((device) => device.id === video.capture_device_id)?.name ?? null,
        }),
      )
    }

    return session ? { ...session, devices, matches, videos } : null
  },

  async getSummary(arenaId: string): Promise<ArenaDashboardSummary> {
    if (!isSupabaseConfigured()) {
      const data = mockArenaStore.getByArenaId(arenaId)
      if (!data) {
        return buildSummary(arenaId, {
          courtCount: 0,
          deviceCount: 0,
          activeDeviceCount: 0,
          sessionsTodayCount: 0,
          matchesCount: 0,
          videosProcessedCount: 0,
        })
      }
      const activeDeviceCount = data.devices.filter(
        (device) => deriveCapturePresence(device.last_seen) === 'online',
      ).length
      const sessionsTodayCount = data.sessions.filter((session) =>
        isToday(session.started_at ?? session.created_at),
      ).length
      const matchesCount = data.matches.filter((match) => isPlayedMatch(match.status)).length
      return buildSummary(arenaId, {
        courtCount: data.courts.length,
        deviceCount: data.devices.length,
        activeDeviceCount,
        sessionsTodayCount,
        matchesCount,
        videosProcessedCount: data.videosProcessedCount,
      })
    }

    const courts = await courtService.listByArena(arenaId)
    const courtIds = new Set(courts.map((court) => court.id))
    const devices = await captureDeviceService.list()
    const sessions = await sessionService.list()
    const arenaDevices = devices.filter((device) => courtIds.has(device.court_id))
    const arenaSessions = sessions.filter((session) => courtIds.has(session.court_id))
    const matches = await getRealMatches(arenaId)
    const matchesCount = matches.filter((match) => isPlayedMatch(match.status)).length
    const matchVideos = await countRealProcessedVideos(matches.map((match) => match.id))
    const sessionVideos = await countRealProcessedSessionVideos(
      arenaSessions.map((session) => session.id),
    )

    return buildSummary(arenaId, {
      courtCount: courts.length,
      deviceCount: arenaDevices.length,
      activeDeviceCount: arenaDevices.filter(
        (device) => deriveCapturePresence(device.last_seen) === 'online',
      ).length,
      sessionsTodayCount: arenaSessions.filter((session) =>
        isToday(session.started_at ?? session.created_at),
      ).length,
      matchesCount,
      videosProcessedCount: matchVideos + sessionVideos,
    })
  },

  async createArenaAndStructure(input: NewArenaInput, ownerId: string): Promise<Arena> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.createStructure(input, ownerId)
    }

    const arena = await arenaService.create({
      name: input.arenaName,
      slug: input.slug,
      address: input.address,
      city: input.city,
      state: input.state,
    })
    const court = await courtService.create({
      arenaId: arena.id,
      name: input.courtName,
      sport: input.courtSport,
    })
    await captureDeviceService.create({
      courtId: court.id,
      name: input.deviceName,
      qrCode: buildQrCode(arena.slug ?? '', court.name, input.deviceName),
      position: input.devicePosition,
    })
    return arena
  },
}
