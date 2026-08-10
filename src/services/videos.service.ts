import { sanitizeFileName, validateVideoFile } from '@/modules/videos/utils/video.validation'

import { storageService } from '@/services/storage.service'
import { getRequiredUserId, getSupabase } from '@/services/supabase'

import type {
  CreateVideoRecordInput,
  UploadVideoInput,
  UploadVideoOptions,
  VideoProcessingStatus,
  VideoRow,
  VideoWithMatch,
} from '@/types/videos'

const VIDEO_BUCKET = 'videos'

export const videosService = {
  async uploadVideo(
    input: UploadVideoInput,
    options: UploadVideoOptions = {},
  ): Promise<{ path: string; url: string }> {
    const validationError = validateVideoFile(input.file)
    if (validationError) {
      throw new Error(validationError)
    }

    const userId = await getRequiredUserId()
    const fileName = sanitizeFileName(input.file.name)
    const path = `videos/${userId}/${input.matchId}/${fileName}`

    await storageService.uploadFile(VIDEO_BUCKET, path, input.file, options)

    const url = await videosService.getSignedUrl(path)
    return { path, url }
  },

  async createVideoRecord(input: CreateVideoRecordInput): Promise<VideoRow> {
    const { data, error } = await getSupabase()
      .from('videos')
      .insert({
        match_id: input.matchId,
        original_url: input.storagePath,
        duration: input.duration ?? null,
        file_size: input.fileSize ?? null,
        mime_type: input.mimeType ?? null,
        processing_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getVideosByMatch(matchId: string): Promise<VideoWithMatch[]> {
    const { data, error } = await getSupabase()
      .from('videos')
      .select('*, match:matches(*, arena:arenas(*))')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .returns<VideoWithMatch[]>()

    if (error) throw error
    return data
  },

  async getVideoById(id: string): Promise<VideoWithMatch | null> {
    const { data, error } = await getSupabase()
      .from('videos')
      .select('*, match:matches(*, arena:arenas(*))')
      .eq('id', id)
      .maybeSingle()
      .returns<VideoWithMatch>()

    if (error) throw error
    return data
  },

  async updateVideoStatus(id: string, status: VideoProcessingStatus): Promise<VideoRow> {
    const { data, error } = await getSupabase()
      .from('videos')
      .update({ processing_status: status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteVideo(id: string, storagePath: string): Promise<void> {
    const { error } = await getSupabase().from('videos').delete().eq('id', id)
    if (error) throw error

    if (storagePath) {
      await storageService.deleteFile(VIDEO_BUCKET, storagePath)
    }
  },

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await getSupabase()
      .storage.from(VIDEO_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  async deleteUploadedVideo(path: string): Promise<void> {
    await storageService.deleteFile(VIDEO_BUCKET, path)
  },
}
