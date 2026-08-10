import { appPaths } from '@/routes/paths'

export function getVideoShareUrl(videoId: string): string {
  return `${window.location.origin}${appPaths.watch(videoId)}`
}

export function getVideoShareText(title: string): string {
  return `Assista ${title} — vídeo compartilhado via Arena AI`
}
