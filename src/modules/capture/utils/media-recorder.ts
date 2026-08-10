/**
 * Tipos de MIME de vídeo preferidos para o MediaRecorder.
 * webm é amplamente suportado (Chrome/Edge/Firefox). Safari prefere mp4
 * quando disponível; a lista é tentada em ordem.
 */
const RECORDING_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
  'video/x-m4v',
]

export function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || !window.MediaRecorder) return ''
  return (
    RECORDING_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? ''
  )
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  )
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
}

/**
 * Deriva a extensão do arquivo a partir do MIME type da gravação.
 * Remove parâmetros de codec (ex.: 'video/webm;codecs=vp9,opus') para casar
 * com a lógica do backend (create_capture_video), evitando extensão '.bin'.
 */
export function getFileExtensionFromMime(mimeType: string | null | undefined): string {
  if (!mimeType) return 'webm'
  const base = mimeType.split(';')[0].trim().toLowerCase()
  return MIME_TO_EXTENSION[base] ?? 'webm'
}

/**
 * Gera uma miniatura (JPEG) a partir do blob da gravação, desenhando o primeiro
 * frame decodificável em um canvas reduzido. Usado no modo mock (que não tem
 * storage) para o dashboard exibir a miniatura.
 */
export async function generateVideoThumbnail(blob: Blob, maxWidth = 320): Promise<string> {
  const url = URL.createObjectURL(blob)
  try {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.src = url
    video.currentTime = 0.1

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error('Não foi possível decodificar o vídeo.'))
    })

    const scale = Math.min(1, maxWidth / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas não suportado.')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
