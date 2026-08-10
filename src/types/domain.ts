import type { Database, Tables } from '@/types/database'

// -----------------------------------------------------------------------------
// Entidades do novo domínio (evolução incremental).
// Seguem o padrão das demais entidades em src/types/: tipos de linha vindos do
// banco (snake_case) + inputs de criação em camelCase.
// -----------------------------------------------------------------------------

// ---- Arena ------------------------------------------------------------------
export type Arena = Tables<'arenas'>
export type ArenaInsert = Database['public']['Tables']['arenas']['Insert']
export type ArenaUpdate = Database['public']['Tables']['arenas']['Update']

export const ARENA_STATUSES = ['active', 'inactive'] as const
export type ArenaStatus = (typeof ARENA_STATUSES)[number]

export interface CreateArenaInput {
  name: string
  ownerId?: string | null
  slug?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  coverUrl?: string | null
  status?: ArenaStatus
}

// ---- Court (Quadra) ---------------------------------------------------------
export type Court = Tables<'courts'>
export type CourtInsert = Database['public']['Tables']['courts']['Insert']
export type CourtUpdate = Database['public']['Tables']['courts']['Update']

export const COURT_STATUSES = ['active', 'inactive'] as const
export type CourtStatus = (typeof COURT_STATUSES)[number]

export interface CreateCourtInput {
  arenaId: string
  name: string
  sport?: string | null
  status?: CourtStatus
}

// ---- Capture Device ---------------------------------------------------------
export type CaptureDevice = Tables<'capture_devices'>
export type CaptureDeviceInsert = Database['public']['Tables']['capture_devices']['Insert']
export type CaptureDeviceUpdate = Database['public']['Tables']['capture_devices']['Update']

export const CAPTURE_DEVICE_STATUSES = ['offline', 'ready', 'recording', 'uploading', 'error'] as const
export type CaptureDeviceStatus = (typeof CAPTURE_DEVICE_STATUSES)[number]

export const CAPTURE_DEVICE_PAIRING_STATUSES = ['unpaired', 'paired'] as const
export type CaptureDevicePairingStatus = (typeof CAPTURE_DEVICE_PAIRING_STATUSES)[number]

export type CapturePresence = 'online' | 'offline'

export interface CreateCaptureDeviceInput {
  courtId: string
  name: string
  qrCode: string
  position?: string | null
  height?: number | null
  angle?: number | null
  status?: CaptureDeviceStatus
}

// Informações públicas mínimas do dispositivo durante o pareamento.
// Nunca contém owner_id, dados administrativos ou o installation id do dono.
export interface CaptureDevicePairingInfo {
  id: string
  name: string
  position: string | null
  courtName: string
  arenaName: string
  paired: boolean
  isMine: boolean
}

// ---- Session (Sessão de gravação) -------------------------------------------
export type Session = Tables<'sessions'>
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export const SESSION_STATUSES = ['scheduled', 'active', 'finished', 'processing', 'failed'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export interface CreateSessionInput {
  courtId: string
  startedAt?: string | null
  endedAt?: string | null
  status?: SessionStatus
  createdBy?: string | null
}
