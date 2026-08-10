import { useEffect, useState } from 'react'

import { captureDeviceService } from '@/services/capture-device.service'

import type { CapturePresence } from '@/types/domain'

import { CAPTURE_DEVICE_OFFLINE_AFTER_MS, CAPTURE_HEARTBEAT_INTERVAL_MS } from '@/utils/capture'

/**
 * Envia heartbeat periódico enquanto o modo captura estiver aberto.
 * O intervalo padrão (15s) é menor que o limiar de offline (30s), então o
 * dispositivo permanece online enquanto a página estiver aberta e vira offline
 * assim que o celular fecha/abandona o modo captura.
 */
export function useCaptureHeartbeat(
  deviceId: string | null | undefined,
  installationId: string | null | undefined,
) {
  const [presence, setPresence] = useState<CapturePresence>('offline')

  const enabled = Boolean(deviceId && installationId)

  useEffect(() => {
    if (!enabled || !deviceId || !installationId) return

    let stopped = false
    let offlineTimer: number | undefined

    const beat = async () => {
      try {
        await captureDeviceService.sendHeartbeat(deviceId, installationId)
        if (stopped) return
        setPresence('online')
        window.clearTimeout(offlineTimer)
        offlineTimer = window.setTimeout(() => {
          if (!stopped) setPresence('offline')
        }, CAPTURE_DEVICE_OFFLINE_AFTER_MS)
      } catch {
        // Heartbeat é best-effort; falhas pontuais não derrubam o modo captura.
      }
    }

    void beat()
    const interval = setInterval(() => {
      void beat()
    }, CAPTURE_HEARTBEAT_INTERVAL_MS)

    return () => {
      stopped = true
      window.clearInterval(interval)
      window.clearTimeout(offlineTimer)
    }
  }, [deviceId, installationId, enabled])

  return { presence }
}
