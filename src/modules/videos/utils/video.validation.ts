export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

export const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024

export function getFileExtension(name: string): string {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index).toLowerCase() : ''
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[^\w.-]+/g, '-')
  return base.length > 80 ? base.slice(-80) : base
}

export function validateVideoFile(file: File): string | null {
  if (file.size === 0) {
    return 'O arquivo selecionado está vazio.'
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return 'O vídeo excede o tamanho máximo permitido de 2GB.'
  }
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(getFileExtension(file.name))) {
    return 'Formato não suportado. Envie um arquivo .mp4, .mov ou .webm.'
  }
  return null
}
