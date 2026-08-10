export type VideoStatus = 'pending' | 'uploading' | 'processing' | 'ready' | 'failed'

export interface VideoMatch {
  id: string
  title: string
  sport: string
  scheduledAt: string | null
  arenaName: string | null
}

export interface Video {
  id: string
  matchId: string
  status: VideoStatus
  url: string | null
  storagePath: string | null
  thumbnailUrl: string | null
  previewUrl: string | null
  duration: number | null
  width: number | null
  height: number | null
  fps: number | null
  codec: string | null
  createdAt: string
  match: VideoMatch | null
}

export interface UploadProgress {
  percent: number
  loadedBytes: number
  totalBytes: number
}

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  pending: 'Pendente',
  uploading: 'Enviando',
  processing: 'Processando',
  ready: 'Pronto',
  failed: 'Falhou',
}
