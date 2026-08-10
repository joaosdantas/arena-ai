import { mockDelay } from '@/modules/auth/services/mock-session'
import { matchService } from '@/modules/matches/services/match.service'
import { mockMatchStore } from '@/modules/matches/services/mock-matches'
import { mockVideoStore } from '@/modules/videos/services/mock-videos'
import type { UploadProgress, Video, VideoStatus } from '@/modules/videos/types/video.types'
import { validateVideoFile } from '@/modules/videos/utils/video.validation'

import { isSupabaseConfigured } from '@/services/supabase'
import { videosService } from '@/services/videos.service'

import type { VideoWithMatch } from '@/types/videos'

interface UploadVideoInput {
  file: File
  matchId: string
}

interface UploadVideoOptions {
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
}

function withMockMatch(video: Video): Video {
  const match = mockMatchStore.byId(video.matchId)
  if (!match) return video
  return {
    ...video,
    match: {
      id: match.id,
      title: match.title,
      sport: match.sport,
      scheduledAt: match.scheduledAt,
      arenaName: match.arena?.name ?? null,
    },
  }
}

async function toVideo(row: VideoWithMatch): Promise<Video> {
  const url = row.original_url ? await videosService.getSignedUrl(row.original_url) : null
  return {
    id: row.id,
    matchId: row.match_id ?? '',
    status: row.processing_status,
    url,
    storagePath: row.original_url,
    thumbnailUrl: row.thumbnail_url,
    previewUrl: row.preview_url,
    duration: row.duration,
    width: row.width,
    height: row.height,
    fps: row.fps,
    codec: row.codec,
    createdAt: row.created_at,
    match: row.match
      ? {
          id: row.match.id,
          title: row.match.title,
          sport: row.match.sport,
          scheduledAt: row.match.scheduled_at,
          arenaName: row.match.arena?.name ?? null,
        }
      : null,
  }
}

function simulateMockProgress(
  totalBytes: number,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let percent = 0
    const interval = window.setInterval(() => {
      if (signal?.aborted) {
        window.clearInterval(interval)
        reject(new DOMException('Upload cancelado.', 'AbortError'))
        return
      }
      percent = Math.min(100, percent + Math.round(Math.random() * 12) + 5)
      onProgress?.({
        percent,
        loadedBytes: Math.round((totalBytes * percent) / 100),
        totalBytes,
      })
      if (percent >= 100) {
        window.clearInterval(interval)
        resolve()
      }
    }, 160)
  })
}

export const videoService = {
  async getVideoByMatch(matchId: string): Promise<Video | null> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const video = mockVideoStore.listByMatch(matchId)[0] ?? null
      return video ? withMockMatch(video) : null
    }
    const rows = await videosService.getVideosByMatch(matchId)
    if (rows.length === 0) return null
    return toVideo(rows[0])
  },

  async getVideoById(id: string): Promise<Video | null> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const video = mockVideoStore.byId(id)
      return video ? withMockMatch(video) : null
    }
    const row = await videosService.getVideoById(id)
    return row ? toVideo(row) : null
  },

  async uploadVideo(input: UploadVideoInput, options: UploadVideoOptions = {}): Promise<Video> {
    const validationError = validateVideoFile(input.file)
    if (validationError) {
      throw new Error(validationError)
    }

    await matchService.updateMatchStatus(input.matchId, 'uploading')

    if (!isSupabaseConfigured()) {
      try {
        await simulateMockProgress(input.file.size, options.onProgress, options.signal)
        const video = mockVideoStore.create(input.matchId, input.file)
        await matchService.updateMatchStatus(input.matchId, 'processing')
        return withMockMatch(video)
      } catch (error) {
        await matchService.updateMatchStatus(input.matchId, 'created')
        throw error
      }
    }

    let uploadedPath: string | null = null

    try {
      const { path } = await videosService.uploadVideo(
        { file: input.file, matchId: input.matchId },
        {
          signal: options.signal,
          onProgress: (percent) =>
            options.onProgress?.({
              percent,
              loadedBytes: Math.round((input.file.size * percent) / 100),
              totalBytes: input.file.size,
            }),
        },
      )
      uploadedPath = path
      const row = await videosService.createVideoRecord({
        matchId: input.matchId,
        storagePath: path,
        fileSize: input.file.size,
        mimeType: input.file.type || null,
      })
      const video = await toVideo({ ...row, match: null })
      await matchService.updateMatchStatus(input.matchId, 'processing')
      return video
    } catch (error) {
      if (uploadedPath) {
        await videosService.deleteUploadedVideo(uploadedPath).catch(() => undefined)
      }
      await matchService.updateMatchStatus(input.matchId, 'created')
      throw error
    }
  },

  async deleteVideo(video: Video): Promise<void> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      mockVideoStore.remove(video.id)
      await matchService.updateMatchStatus(video.matchId, 'created')
      return
    }
    await videosService.deleteVideo(video.id, video.storagePath ?? '')
    await matchService.updateMatchStatus(video.matchId, 'created')
  },

  async updateVideoStatus(id: string, status: VideoStatus): Promise<Video> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const video = mockVideoStore.updateStatus(id, status)
      if (!video) throw new Error('Vídeo não encontrado.')
      return withMockMatch(video)
    }
    const row = await videosService.updateVideoStatus(id, status)
    return toVideo({ ...row, match: null })
  },
}
