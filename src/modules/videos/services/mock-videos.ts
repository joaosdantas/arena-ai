import type { Video, VideoStatus } from '@/modules/videos/types/video.types'
import { sanitizeFileName } from '@/modules/videos/utils/video.validation'

const MOCK_VIDEOS_KEY = 'arena-ai:mock-videos'

function readAll(): Video[] {
  const raw = localStorage.getItem(MOCK_VIDEOS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Video[]) : []
  } catch {
    return []
  }
}

function persist(list: Video[]): void {
  localStorage.setItem(MOCK_VIDEOS_KEY, JSON.stringify(list))
}

function createObjectUrl(file: File): string {
  return URL.createObjectURL(file)
}

export const mockVideoStore = {
  listByMatch(matchId: string): Video[] {
    return readAll().filter((video) => video.matchId === matchId)
  },

  byId(id: string): Video | null {
    return readAll().find((video) => video.id === id) ?? null
  },

  create(matchId: string, file: File): Video {
    const video: Video = {
      id: crypto.randomUUID(),
      matchId,
      status: 'processing',
      url: createObjectUrl(file),
      storagePath: `videos/mock/${matchId}/${sanitizeFileName(file.name)}`,
      thumbnailUrl: null,
      previewUrl: null,
      duration: null,
      width: null,
      height: null,
      fps: null,
      codec: null,
      createdAt: new Date().toISOString(),
      match: null,
    }
    persist([video, ...readAll()])
    return video
  },

  updateStatus(id: string, status: VideoStatus): Video | null {
    const list = readAll()
    const index = list.findIndex((video) => video.id === id)
    if (index === -1) return null
    const updated = { ...list[index], status }
    list[index] = updated
    persist(list)
    return updated
  },

  remove(id: string): void {
    persist(readAll().filter((video) => video.id !== id))
  },
}
