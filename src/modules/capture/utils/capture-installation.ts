import { generateCaptureToken } from '@/utils/capture'

const INSTALLATION_ID_KEY = 'arena-ai:capture-installation-id'

/**
 * Identificador persistente do celular/browser usado no pareamento.
 * Vive apenas no localStorage do aparelho e identifica o dispositivo físico
 * (não o lógico). Nenhum fingerprint invasivo é coletado.
 */
export function getOrCreateCaptureInstallationId(): string {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(INSTALLATION_ID_KEY)
  if (existing) return existing
  const id = generateCaptureToken(24)
  window.localStorage.setItem(INSTALLATION_ID_KEY, id)
  return id
}
