export type MatchStatus = 'created' | 'recording' | 'uploading' | 'processing' | 'ready' | 'failed'

export type SportType = 'football' | 'basketball' | 'volleyball' | 'other'

export interface MatchArena {
  id: string
  name: string
  city: string | null
  address: string | null
  coverUrl: string | null
}

export interface Match {
  id: string
  ownerId: string
  arenaId: string | null
  title: string
  sport: SportType
  status: MatchStatus
  isPublic: boolean
  description: string | null
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  thumbnailUrl: string | null
  videoUrl: string | null
  previewUrl: string | null
  createdAt: string
  arena: MatchArena | null
}

export interface MatchFormData {
  title: string
  sport: SportType
  arenaId: string
  description: string
  scheduledDate: string
}

export const MATCH_STATUSES: MatchStatus[] = [
  'created',
  'recording',
  'uploading',
  'processing',
  'ready',
  'failed',
]

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  created: 'Criada',
  recording: 'Gravando',
  uploading: 'Enviando',
  processing: 'Processando',
  ready: 'Pronta',
  failed: 'Falhou',
}

export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'football', label: 'Futebol' },
  { value: 'basketball', label: 'Basquete' },
  { value: 'volleyball', label: 'Vôlei' },
  { value: 'other', label: 'Outro' },
]

export const SPORT_LABELS: Record<SportType, string> = {
  football: 'Futebol',
  basketball: 'Basquete',
  volleyball: 'Vôlei',
  other: 'Outro',
}
