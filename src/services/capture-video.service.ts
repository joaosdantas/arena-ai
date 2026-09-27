import { mockArenaStore } from '@/modules/arena/services/mock-arena-dashboard'

import { storageService } from '@/services/storage.service'
import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type { CreateCaptureVideoInput, CaptureVideoUpload, VideoRow } from '@/types/videos'

const VIDEO_BUCKET = 'videos'

export interface ActiveCaptureSession {
  sessionId: string
  status: string
  startedAt: string | null
  courtName: string
  arenaName: string
}

export interface CapturedVideoUploadOptions {
  onProgress?: (percent: number) => void
  thumbnailUrl?: string | null
}

/**
 * Fluxo do celular no modo captura. O celular NÃO está logado, então tudo passa
 * por RPCs públicas (SECURITY DEFINER) que validam o pareamento e a sessão
 * ativa antes de criar/atualizar registros ou enviar para o storage.
 */
export const captureVideoService = {
  /** Sessão ativa vinculada ao dispositivo (se houver). */
  async getActiveSession(
    deviceId: string,
    installationId: string,
  ): Promise<ActiveCaptureSession | null> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.getActiveSession(deviceId, installationId)
    }

    const { data, error } = await getSupabase().rpc('get_active_capture_session', {
      p_device_id: deviceId,
      p_installation_id: installationId,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) return null
    return {
      sessionId: row.session_id,
      status: row.status,
      startedAt: row.started_at,
      courtName: row.court_name,
      arenaName: row.arena_name,
    }
  },

  /** Cria o registro do vídeo após a gravação e devolve o caminho no storage. */
  async createVideo(input: CreateCaptureVideoInput): Promise<CaptureVideoUpload> {
    if (!isSupabaseConfigured()) return mockArenaStore.createCaptureVideo(input)

    const { data, error } = await getSupabase().rpc('create_capture_video', {
      p_device_id: input.deviceId,
      p_installation_id: input.installationId,
      p_session_id: input.sessionId,
      p_mime_type: input.mimeType ?? null,
      p_file_size: input.fileSize ?? null,
      p_duration: input.duration ?? null,
      p_match_id: input.matchId ?? null,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) throw new Error('Não foi possível registrar a gravação.')
    return { videoId: row.video_id, storagePath: row.storage_path }
  },

  /** Registra o início no banco antes de iniciar o MediaRecorder. */
  async startVideo(input: CreateCaptureVideoInput): Promise<CaptureVideoUpload> {
    if (!isSupabaseConfigured()) return mockArenaStore.createCaptureVideo(input)
    const { data, error } = await getSupabase().rpc('start_capture_video', {
      p_device_id: input.deviceId,
      p_installation_id: input.installationId,
      p_session_id: input.sessionId,
      p_mime_type: input.mimeType ?? null,
      p_match_id: input.matchId ?? null,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) throw new Error('Não foi possível iniciar o registro da gravação.')
    return { videoId: row.video_id, storagePath: row.storage_path }
  },

  /** Persiste duração e término antes do upload começar. */
  async finishVideo(
    videoId: string,
    installationId: string,
    duration: number,
    fileSize: number,
    mimeType: string,
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      if (!mockArenaStore.finishCaptureVideo(videoId, installationId, duration, fileSize, mimeType)) {
        throw new Error('Não foi possível finalizar o registro da gravação.')
      }
      return
    }
    const { data, error } = await getSupabase().rpc('finish_capture_video', {
      p_video_id: videoId,
      p_installation_id: installationId,
      p_duration: duration,
      p_file_size: fileSize,
      p_mime_type: mimeType,
    })
    if (error) throw error
    if (!data) throw new Error('Não foi possível finalizar o registro da gravação.')
  },

  /** Envia o arquivo da gravação para o storage de captura. */
  async uploadCapturedVideo(
    file: File,
    storagePath: string,
    options: CapturedVideoUploadOptions = {},
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      await mockArenaStore.uploadCapturedVideo(file, storagePath, options)
      return
    }

    await storageService.uploadAnonymous(VIDEO_BUCKET, storagePath, file, {
      onProgress: options.onProgress,
    })
  },

  /** Marca o upload como concluído (pending) ou falho (failed). */
  async updateVideoStatus(
    videoId: string,
    installationId: string,
    status: 'pending' | 'uploading' | 'failed',
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.updateCaptureVideoStatus(videoId, installationId, status)
    }

    const { data, error } = await getSupabase().rpc('update_capture_video_status', {
      p_video_id: videoId,
      p_installation_id: installationId,
      p_status: status,
    })
    if (error) throw error
    return Boolean(data)
  },

  /** Vídeos de uma sessão (dashboard da arena). */
  async getVideosBySession(sessionId: string): Promise<VideoRow[]> {
    if (!isSupabaseConfigured()) return mockArenaStore.getVideosBySession(sessionId)

    const { data, error } = await getSupabase()
      .from('videos')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
