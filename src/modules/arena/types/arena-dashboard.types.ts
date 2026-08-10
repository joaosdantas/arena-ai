import type { Arena, CaptureDevice, Court, Session } from '@/types/domain'
import type { CapturePresence } from '@/types/domain'

export type CaptureDeviceStatus = 'offline' | 'ready' | 'recording' | 'uploading' | 'error'
export type SessionStatus = 'scheduled' | 'active' | 'finished' | 'processing' | 'failed'
export type CourtStatus = 'active' | 'inactive'

export const CAPTURE_DEVICE_STATUS_LABELS: Record<CaptureDeviceStatus, string> = {
  offline: 'Offline',
  ready: 'Online',
  recording: 'Gravando',
  uploading: 'Enviando',
  error: 'Erro',
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Agendada',
  active: 'Gravando',
  finished: 'Finalizada',
  processing: 'Processando',
  failed: 'Falha',
}

export const COURT_STATUS_LABELS: Record<CourtStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
}

export interface CourtView {
  id: string
  name: string
  sport: string | null
  status: CourtStatus
  deviceCount: number
}

export interface CaptureDeviceView {
  id: string
  courtId: string
  courtName: string
  name: string
  qrCode: string
  pairingToken: string
  pairingUrl: string
  paired: boolean
  position: string | null
  height: number | null
  angle: number | null
  status: CaptureDeviceStatus
  presence: CapturePresence
  lastSeen: string | null
}

export interface SessionView {
  id: string
  courtId: string
  courtName: string
  startedAt: string | null
  endedAt: string | null
  status: SessionStatus
  createdAt: string
}

export type VideoProcessingStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'failed'

export interface SessionVideoView {
  id: string
  sessionId: string | null
  captureDeviceId: string | null
  matchId: string | null
  status: VideoProcessingStatus
  duration: number | null
  thumbnailUrl: string | null
  previewUrl: string | null
  mimeType: string | null
  fileSize: number | null
  createdAt: string
}

export interface ArenaMatchSummary {
  id: string
  title: string
  sport: string
  status: string
}

export interface SessionDetail extends SessionView {
  devices: CaptureDeviceView[]
  matches: ArenaMatchSummary[]
  videos: SessionVideoView[]
}

export interface ArenaDashboardSummary {
  arenaId: string
  courtCount: number
  deviceCount: number
  activeDeviceCount: number
  sessionsTodayCount: number
  matchesCount: number
  videosProcessedCount: number
}

export interface NewArenaInput {
  arenaName: string
  slug: string
  address: string
  city: string
  state: string
  courtName: string
  courtSport: string
  deviceName: string
  devicePosition: string
}

// Re-export dos tipos de domínio para conveniência do módulo.
export type { Arena, CaptureDevice, Court, Session }
