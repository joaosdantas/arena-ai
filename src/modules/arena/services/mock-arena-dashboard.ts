import type { Arena, CaptureDevice, Court, Session } from '@/types/domain'

import type { VideoProcessingStatus } from '@/types/videos'

import { generateCaptureToken } from '@/utils/capture'

const MOCK_ARENA_KEY = 'arena-ai:mock-arena-dashboard'

export interface MockArenaMatch {
  id: string
  title: string
  sport: string
  status: string
  sessionId: string | null
}

export interface MockVideoRecord {
  id: string
  session_id: string | null
  capture_device_id: string | null
  match_id: string | null
  original_url: string
  preview_url: string | null
  thumbnail_url: string | null
  processing_status: VideoProcessingStatus
  mime_type: string | null
  file_size: number | null
  duration: number | null
  codec: string | null
  fps: number | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
}

export interface MockArenaData {
  arena: Arena
  courts: Court[]
  devices: CaptureDevice[]
  sessions: Session[]
  matches: MockArenaMatch[]
  videos: MockVideoRecord[]
  videosProcessedCount: number
}

type MockStore = Record<string, MockArenaData | undefined>

function nowIso(): string {
  return new Date().toISOString()
}

function readAll(): MockStore {
  try {
    const raw = localStorage.getItem(MOCK_ARENA_KEY)
    return raw ? (JSON.parse(raw) as MockStore) : {}
  } catch {
    return {}
  }
}

function writeAll(data: MockStore): void {
  localStorage.setItem(MOCK_ARENA_KEY, JSON.stringify(data))
}

function seedData(ownerId: string): MockArenaData {
  const now = nowIso()
  const arena: Arena = {
    id: 'mock-arena-xp',
    owner_id: ownerId,
    name: 'Arena XP',
    slug: 'arena-xp',
    address: 'Rua dos Campeões, 10',
    city: 'São Paulo',
    state: 'SP',
    cover_url: null,
    status: 'active',
    created_at: now,
    updated_at: now,
  }

  const courts: Court[] = [
    {
      id: 'mock-court-1',
      arena_id: arena.id,
      name: 'Quadra 1',
      sport: 'Futebol',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mock-court-2',
      arena_id: arena.id,
      name: 'Quadra 2',
      sport: 'Basquete',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  ]

  const devices: CaptureDevice[] = [
    {
      id: 'mock-device-1',
      court_id: courts[0].id,
      name: 'Camera Lateral Principal',
      qr_code: 'CAM-LAT-PRINCIPAL-001',
      pairing_token: generateCaptureToken(),
      paired: false,
      capture_installation_id: null,
      position: 'lateral direita',
      height: 3,
      angle: 45,
      status: 'ready',
      last_seen: new Date(Date.now() - 10_000).toISOString(),
      session_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mock-device-2',
      court_id: courts[0].id,
      name: 'Camera Fundo',
      qr_code: 'CAM-FUNDO-001',
      pairing_token: generateCaptureToken(),
      paired: false,
      capture_installation_id: null,
      position: 'fundo',
      height: 4,
      angle: 0,
      status: 'ready',
      last_seen: new Date(Date.now() - 5_000).toISOString(),
      session_id: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mock-device-3',
      court_id: courts[1].id,
      name: 'Camera Lateral Esquerda',
      qr_code: 'CAM-LAT-ESQUERDA-001',
      pairing_token: generateCaptureToken(),
      paired: false,
      capture_installation_id: null,
      position: 'lateral esquerda',
      height: 3,
      angle: -45,
      status: 'offline',
      last_seen: new Date(Date.now() - 3_600_000).toISOString(),
      session_id: null,
      created_at: now,
      updated_at: now,
    },
  ]

  const sessions: Session[] = [
    {
      id: 'mock-session-1',
      court_id: courts[0].id,
      started_at: now,
      ended_at: null,
      status: 'active',
      created_by: ownerId,
      created_at: now,
      updated_at: now,
    },
    {
      id: 'mock-session-2',
      court_id: courts[1].id,
      started_at: null,
      ended_at: null,
      status: 'scheduled',
      created_by: ownerId,
      created_at: now,
      updated_at: now,
    },
  ]

  const videos: MockVideoRecord[] = [
    {
      id: 'mock-video-1',
      session_id: sessions[0].id,
      capture_device_id: devices[0].id,
      match_id: 'mock-arena-match-1',
      original_url: `capture/mock-installation/${sessions[0].id}/${devices[0].id}/mock-video-1.webm`,
      preview_url: null,
      thumbnail_url: null,
      processing_status: 'ready',
      mime_type: 'video/webm',
      file_size: 24_000_000,
      duration: 38,
      codec: null,
      fps: null,
      width: null,
      height: null,
      created_at: now,
      updated_at: now,
    },
  ]

  return {
    arena,
    courts,
    devices,
    sessions,
    matches: [
      {
        id: 'mock-arena-match-1',
        title: 'Furacão FC vs. Atlético Real',
        sport: 'Futebol',
        status: 'ready',
        sessionId: sessions[0].id,
      },
      {
        id: 'mock-arena-match-2',
        title: 'Lobos da Serra vs. Dragões',
        sport: 'Basquete',
        status: 'recording',
        sessionId: sessions[0].id,
      },
      {
        id: 'mock-arena-match-3',
        title: 'Semifinal Alvorada',
        sport: 'Futebol',
        status: 'created',
        sessionId: null,
      },
    ],
    videos,
    videosProcessedCount: 25,
  }
}

export function buildQrCode(slug: string, courtName: string, deviceName: string): string {
  const source = `${slug}-${courtName}-${deviceName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return source.toUpperCase().slice(0, 32)
}

export interface MockDeviceContext {
  device: CaptureDevice
  court: Court
  arena: Arena
}

interface FoundContext extends MockDeviceContext {
  ownerId: string
  data: MockArenaData
}

function findDeviceContext(
  predicate: (device: CaptureDevice, court: Court) => boolean,
): FoundContext | null {
  const store = readAll()
  for (const [ownerId, data] of Object.entries(store)) {
    if (!data) continue
    for (const court of data.courts) {
      const device = data.devices.find((item) => predicate(item, court))
      if (device) return { ownerId, data, device, court, arena: data.arena }
    }
  }
  return null
}

function persistDevice(ownerId: string, updated: CaptureDevice): void {
  const store = readAll()
  const entry = store[ownerId]
  if (!entry) return
  entry.devices = entry.devices.map((item) => (item.id === updated.id ? updated : item))
  writeAll(store)
}

function findSessionContext(
  sessionId: string,
): { ownerId: string; data: MockArenaData; session: Session } | null {
  const store = readAll()
  for (const [ownerId, data] of Object.entries(store)) {
    if (!data) continue
    const session = data.sessions.find((item) => item.id === sessionId)
    if (session) return { ownerId, data, session }
  }
  return null
}

function persistSession(ownerId: string, updated: Session): void {
  const store = readAll()
  const entry = store[ownerId]
  if (!entry) return
  entry.sessions = entry.sessions.map((item) => (item.id === updated.id ? updated : item))
  writeAll(store)
}

function touchSessionTimestamps(session: Session): Session {
  return { ...session, updated_at: nowIso() }
}

/** Espelha a lógica de recalculate_session_status do banco. */
function recalculateSessionMock(data: MockArenaData, session: Session): Session {
  if (!['active', 'processing', 'failed'].includes(session.status)) {
    return session
  }
  const sessionVideos = data.videos.filter((video) => video.session_id === session.id)

  let nextStatus: Session['status']
  if (sessionVideos.some((video) => video.processing_status === 'failed')) {
    nextStatus = 'failed'
  } else if (
    sessionVideos.some((video) =>
      ['pending', 'uploading', 'processing'].includes(video.processing_status),
    )
  ) {
    nextStatus = 'processing'
  } else {
    nextStatus = 'finished'
  }

  return {
    ...session,
    status: nextStatus,
    ended_at:
      nextStatus === 'finished' || nextStatus === 'failed'
        ? (session.ended_at ?? nowIso())
        : session.ended_at,
    updated_at: nowIso(),
  }
}

function recalculateAndPersist(sessionId: string): void {
  const ctx = findSessionContext(sessionId)
  if (!ctx) return
  persistSession(ctx.ownerId, recalculateSessionMock(ctx.data, ctx.session))
}

function updateVideoAndPersist(
  ownerId: string,
  videoId: string,
  patch: Partial<MockVideoRecord>,
): MockVideoRecord | null {
  const store = readAll()
  const entry = store[ownerId]
  if (!entry) return null
  const existing = entry.videos.find((item) => item.id === videoId)
  if (!existing) return null
  const updated = { ...existing, ...patch, updated_at: nowIso() }
  entry.videos = entry.videos.map((item) => (item.id === videoId ? updated : item))
  writeAll(store)
  return updated
}

/** Simula o worker de processamento no mock: pending -> processing -> ready. */
function scheduleMockWorker(videoId: string): void {
  window.setTimeout(() => {
    const store = readAll()
    const entry = Object.values(store).find((item) =>
      item?.videos.some((video) => video.id === videoId),
    )
    if (!entry) return
    const video = entry.videos.find((item) => item.id === videoId)
    if (!video || video.processing_status !== 'pending') return

    updateVideoAndPersist(entry.arena.owner_id ?? '', videoId, {
      processing_status: 'processing',
    })
    if (video.session_id) recalculateAndPersist(video.session_id)

    window.setTimeout(() => {
      updateVideoAndPersist(entry.arena.owner_id ?? '', videoId, {
        processing_status: 'ready',
      })
      if (video.session_id) recalculateAndPersist(video.session_id)
    }, 4_000)
  }, 3_000)
}

export const mockArenaStore = {
  getArenaByOwner(ownerId: string): Arena | null {
    const data = readAll()
    const existing = data[ownerId]
    if (existing) return existing.arena
    const seeded = seedData(ownerId)
    data[ownerId] = seeded
    writeAll(data)
    return seeded.arena
  },

  getByArenaId(arenaId: string): MockArenaData | null {
    const data = readAll()
    const entry = Object.values(data).find((item) => item?.arena.id === arenaId)
    return entry ?? null
  },

  getBySessionId(sessionId: string): MockArenaData | null {
    const data = readAll()
    const entry = Object.values(data).find((item) =>
      item?.sessions.some((session) => session.id === sessionId),
    )
    return entry ?? null
  },

  createStructure(
    input: {
      arenaName: string
      slug: string
      address: string
      city: string
      state: string
      courtName: string
      courtSport: string
      deviceName: string
      devicePosition: string
    },
    ownerId: string,
  ): Arena {
    const data = readAll()
    const now = nowIso()
    const arena: Arena = {
      id: crypto.randomUUID(),
      owner_id: ownerId,
      name: input.arenaName,
      slug: input.slug,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      cover_url: null,
      status: 'active',
      created_at: now,
      updated_at: now,
    }
    const court: Court = {
      id: crypto.randomUUID(),
      arena_id: arena.id,
      name: input.courtName,
      sport: input.courtSport,
      status: 'active',
      created_at: now,
      updated_at: now,
    }
    const device: CaptureDevice = {
      id: crypto.randomUUID(),
      court_id: court.id,
      name: input.deviceName,
      qr_code: buildQrCode(arena.slug ?? '', court.name, input.deviceName),
      pairing_token: generateCaptureToken(),
      paired: false,
      capture_installation_id: null,
      position: input.devicePosition,
      height: null,
      angle: null,
      status: 'offline',
      last_seen: null,
      session_id: null,
      created_at: now,
      updated_at: now,
    }
    data[ownerId] = {
      arena,
      courts: [court],
      devices: [device],
      sessions: [],
      matches: [],
      videos: [],
      videosProcessedCount: 0,
    }
    writeAll(data)
    return arena
  },

  // ---------------------------------------------------------------------------
  // Dispositivos
  // ---------------------------------------------------------------------------

  findDeviceByPairingToken(pairingToken: string): MockDeviceContext | null {
    const found = findDeviceContext((device) => device.pairing_token === pairingToken)
    if (!found) return null
    return { device: found.device, court: found.court, arena: found.arena }
  },

  getDeviceById(deviceId: string): MockDeviceContext | null {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return null
    return { device: found.device, court: found.court, arena: found.arena }
  },

  pairDevice(pairingToken: string, installationId: string): boolean {
    const found = findDeviceContext((device) => device.pairing_token === pairingToken)
    if (!found) return false
    if (found.device.paired && found.device.capture_installation_id !== installationId) {
      return false
    }
    const now = nowIso()
    persistDevice(found.ownerId, {
      ...found.device,
      paired: true,
      capture_installation_id: installationId,
      status: 'ready',
      last_seen: now,
      updated_at: now,
    })
    return true
  },

  sendHeartbeat(deviceId: string, installationId: string): boolean {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return false
    if (!found.device.paired || found.device.capture_installation_id !== installationId) {
      return false
    }
    const now = nowIso()
    persistDevice(found.ownerId, {
      ...found.device,
      status:
        found.device.status === 'recording' || found.device.status === 'uploading'
          ? found.device.status
          : 'ready',
      last_seen: now,
      updated_at: now,
    })
    return true
  },

  setDeviceStatus(
    deviceId: string,
    installationId: string,
    status: CaptureDevice['status'],
  ): boolean {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return false
    if (!found.device.paired || found.device.capture_installation_id !== installationId) {
      return false
    }
    if (!['ready', 'recording', 'uploading', 'error'].includes(status)) return false
    persistDevice(found.ownerId, {
      ...found.device,
      status,
      last_seen: nowIso(),
      updated_at: nowIso(),
    })
    return true
  },

  unpairDevice(deviceId: string): boolean {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return false
    persistDevice(found.ownerId, {
      ...found.device,
      paired: false,
      capture_installation_id: null,
      status: 'offline',
      last_seen: null,
      session_id: null,
      updated_at: nowIso(),
    })
    return true
  },

  attachDevice(sessionId: string, deviceId: string): void {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return
    const session = found.data.sessions.find((item) => item.id === sessionId)
    if (!session || session.court_id !== found.device.court_id) return
    persistDevice(found.ownerId, {
      ...found.device,
      session_id: sessionId,
      updated_at: nowIso(),
    })
  },

  detachDevice(sessionId: string, deviceId: string): void {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found || found.device.session_id !== sessionId) return
    persistDevice(found.ownerId, {
      ...found.device,
      session_id: null,
      updated_at: nowIso(),
    })
  },

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  getSession(sessionId: string): Session | null {
    const ctx = findSessionContext(sessionId)
    return ctx ? ctx.session : null
  },

  listSessions(): Session[] {
    const store = readAll()
    const result: Session[] = []
    for (const data of Object.values(store)) {
      if (!data) continue
      result.push(...data.sessions)
    }
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  listSessionsByCourt(courtId: string): Session[] {
    return mockArenaStore
      .listSessions()
      .filter((session) => session.court_id === courtId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  createSession(input: { courtId: string; startedAt?: string | null; status?: Session['status'] }): Session {
    const store = readAll()
    const entry = Object.values(store).find((item) =>
      item?.courts.some((court) => court.id === input.courtId),
    )
    if (!entry) throw new Error('Quadra não encontrada.')
    const now = nowIso()
    const session: Session = {
      id: crypto.randomUUID(),
      court_id: input.courtId,
      started_at: input.startedAt ?? null,
      ended_at: null,
      status: input.status ?? 'scheduled',
      created_by: entry.arena.owner_id,
      created_at: now,
      updated_at: now,
    }
    entry.sessions = [...entry.sessions, session]
    writeAll(store)
    return session
  },

  updateSession(sessionId: string, updates: Partial<Session>): Session {
    const ctx = findSessionContext(sessionId)
    if (!ctx) throw new Error('Sessão não encontrada.')
    const updated = touchSessionTimestamps({ ...ctx.session, ...updates })
    persistSession(ctx.ownerId, updated)
    return updated
  },

  startSession(sessionId: string): Session {
    const ctx = findSessionContext(sessionId)
    if (!ctx) throw new Error('Sessão não encontrada.')
    const updated = touchSessionTimestamps({
      ...ctx.session,
      status: 'active',
      started_at: ctx.session.started_at ?? nowIso(),
    })
    persistSession(ctx.ownerId, updated)
    return updated
  },

  failSession(sessionId: string): Session {
    const ctx = findSessionContext(sessionId)
    if (!ctx) throw new Error('Sessão não encontrada.')
    const updated = touchSessionTimestamps({
      ...ctx.session,
      status: 'failed',
      ended_at: ctx.session.ended_at ?? nowIso(),
    })
    persistSession(ctx.ownerId, updated)
    return updated
  },

  finishSession(sessionId: string): Session {
    const ctx = findSessionContext(sessionId)
    if (!ctx) throw new Error('Sessão não encontrada.')
    const updated = touchSessionTimestamps(recalculateSessionMock(ctx.data, ctx.session))
    persistSession(ctx.ownerId, updated)
    return updated
  },

  recalculateSession(sessionId: string): Session {
    const ctx = findSessionContext(sessionId)
    if (!ctx) throw new Error('Sessão não encontrada.')
    const updated = touchSessionTimestamps(recalculateSessionMock(ctx.data, ctx.session))
    persistSession(ctx.ownerId, updated)
    return updated
  },

  // ---------------------------------------------------------------------------
  // Captura (fluxo do celular no mock)
  // ---------------------------------------------------------------------------

  getActiveSession(
    deviceId: string,
    installationId: string,
  ): { sessionId: string; status: string; startedAt: string | null; courtName: string; arenaName: string } | null {
    const found = findDeviceContext((device) => device.id === deviceId)
    if (!found) return null
    if (!found.device.paired || found.device.capture_installation_id !== installationId) return null
    if (!found.device.session_id) return null
    const session = found.data.sessions.find((item) => item.id === found.device?.session_id)
    if (!session) return null
    if (!['active', 'processing'].includes(session.status)) return null
    return {
      sessionId: session.id,
      status: session.status,
      startedAt: session.started_at,
      courtName: found.court.name,
      arenaName: found.arena.name,
    }
  },

  createCaptureVideo(input: {
    deviceId: string
    installationId: string
    sessionId: string
    mimeType?: string | null
    fileSize?: number | null
    duration?: number | null
    matchId?: string | null
  }): { videoId: string; storagePath: string } {
    const found = findDeviceContext((device) => device.id === input.deviceId)
    if (!found) throw new Error('Dispositivo não encontrado.')
    if (!found.device.paired || found.device.capture_installation_id !== input.installationId) {
      throw new Error('Dispositivo não pareado para esta instalação.')
    }
    const session = found.data.sessions.find((item) => item.id === input.sessionId)
    if (!session) throw new Error('Sessão não encontrada.')
    if (
      (session.status !== 'active' && session.status !== 'processing') ||
      session.court_id !== found.device.court_id
    ) {
      throw new Error('Sessão não está ativa para este dispositivo.')
    }

    const videoId = crypto.randomUUID()
    const baseMime = (input.mimeType ?? '').split(';')[0].trim().toLowerCase()
    const ext =
      baseMime === 'video/mp4'
        ? 'mp4'
        : baseMime === 'video/x-m4v'
          ? 'm4v'
          : baseMime === 'video/quicktime'
            ? 'mov'
            : 'webm'
    const storagePath = `capture/${input.installationId}/${input.sessionId}/${input.deviceId}/${videoId}.${ext}`

    const store = readAll()
    const entry = store[found.ownerId]
    if (!entry) throw new Error('Dados da arena não encontrados.')
    const now = nowIso()
    const record: MockVideoRecord = {
      id: videoId,
      session_id: session.id,
      capture_device_id: found.device.id,
      match_id: input.matchId ?? null,
      original_url: storagePath,
      preview_url: null,
      thumbnail_url: null,
      processing_status: 'uploading',
      mime_type: input.mimeType ?? 'video/webm',
      file_size: input.fileSize ?? null,
      duration: input.duration ?? null,
      codec: null,
      fps: null,
      width: null,
      height: null,
      created_at: now,
      updated_at: now,
    }
    entry.videos = [...entry.videos, record]
    writeAll(store)
    return { videoId, storagePath }
  },

  async uploadCapturedVideo(
    file: File,
    storagePath: string,
    options: { onProgress?: (percent: number) => void; thumbnailUrl?: string | null } = {},
  ): Promise<void> {
    const store = readAll()
    const entry = Object.values(store).find((item) =>
      item?.videos.some((video) => video.original_url === storagePath),
    )
    if (!entry) return

    const video = entry.videos.find((item) => item.original_url === storagePath)
    if (!video) return

    for (let percent = 10; percent <= 100; percent += 10) {
      await new Promise((resolve) => window.setTimeout(resolve, 80))
      options.onProgress?.(percent)
    }

    const previewUrl = URL.createObjectURL(file)
    const ownerId = entry.arena.owner_id ?? ''
    updateVideoAndPersist(ownerId, video.id, {
      preview_url: previewUrl,
      thumbnail_url: options.thumbnailUrl ?? video.thumbnail_url,
      file_size: file.size,
      mime_type: file.type || video.mime_type,
    })
  },

  updateCaptureVideoStatus(
    videoId: string,
    installationId: string,
    status: 'pending' | 'uploading' | 'failed',
  ): boolean {
    const store = readAll()
    const entry = Object.values(store).find((item) =>
      item?.videos.some((video) => video.id === videoId),
    )
    if (!entry) return false
    const video = entry.videos.find((item) => item.id === videoId)
    if (!video) return false

    const device = entry.devices.find((item) => item.id === video.capture_device_id)
    if (!device || !device.paired || device.capture_installation_id !== installationId) {
      return false
    }
    if (!['uploading', 'pending', 'failed'].includes(video.processing_status)) return false

    updateVideoAndPersist(entry.arena.owner_id ?? '', videoId, {
      processing_status: status,
    })
    if (status === 'pending' && video.session_id) {
      recalculateAndPersist(video.session_id)
      scheduleMockWorker(videoId)
    }
    return true
  },

  getVideosBySession(sessionId: string): MockVideoRecord[] {
    const store = readAll()
    const result: MockVideoRecord[] = []
    for (const data of Object.values(store)) {
      if (!data) continue
      result.push(...data.videos.filter((video) => video.session_id === sessionId))
    }
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  getVideosByDevice(deviceId: string): MockVideoRecord[] {
    const store = readAll()
    const result: MockVideoRecord[] = []
    for (const data of Object.values(store)) {
      if (!data) continue
      result.push(...data.videos.filter((video) => video.capture_device_id === deviceId))
    }
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  },
}
