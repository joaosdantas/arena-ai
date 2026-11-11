import type { CapturePresence } from '@/types/domain'

// Intervalo do heartbeat enviado pelo celular no modo captura.
export const CAPTURE_HEARTBEAT_INTERVAL_MS = 15_000

// Tempo sem heartbeat após o qual o dispositivo é considerado offline.
export const CAPTURE_DEVICE_OFFLINE_AFTER_MS = 30_000
export const MAX_CAPTURE_ROOM_DEVICES = 10

/**
 * Gera um token aleatório seguro (base64url) usado para o pareamento e para o
 * identificador de instalação do celular. Não é baseado em UUID e não expõe
 * nenhuma informação do dispositivo.
 */
export function generateCaptureToken(bytes = 18): string {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  let binary = ''
  for (const byte of buffer) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Presença derivada da frescura do last_seen (online/offline). */
export function deriveCapturePresence(lastSeen: string | null | undefined): CapturePresence {
  if (!lastSeen) return 'offline'
  return Date.now() - new Date(lastSeen).getTime() < CAPTURE_DEVICE_OFFLINE_AFTER_MS
    ? 'online'
    : 'offline'
}

/** URL pública de pareamento codificada no QR Code. */
export function buildCapturePairingUrl(pairingToken: string): string {
  return `${window.location.origin}/capture/${pairingToken}`
}

/** URL pública para entrar em uma sala de captura. */
export function buildCaptureRoomUrl(roomToken: string): string {
  return `${window.location.origin}/capture/room/${roomToken}`
}
