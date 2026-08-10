import type { Database, Tables } from '@/types/database'

export type VideoRow = Tables<'videos'>
export type VideoInsert = Database['public']['Tables']['videos']['Insert']
export type VideoUpdate = Database['public']['Tables']['videos']['Update']
export type VideoProcessingStatus = Database['public']['Enums']['video_processing_status']

export type VideoWithMatch = VideoRow & {
  match:
    | (Database['public']['Tables']['matches']['Row'] & {
        arena: Database['public']['Tables']['arenas']['Row'] | null
      })
    | null
}

export interface UploadVideoInput {
  file: File
  matchId: string
}

export interface UploadVideoOptions {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export interface CreateVideoRecordInput {
  matchId: string
  storagePath: string
  duration?: number | null
  fileSize?: number | null
  mimeType?: string | null
}

export interface CreateCaptureVideoInput {
  deviceId: string
  installationId: string
  sessionId: string
  mimeType?: string | null
  fileSize?: number | null
  duration?: number | null
  matchId?: string | null
}

export interface CaptureVideoUpload {
  videoId: string
  storagePath: string
}
