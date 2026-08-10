import { useQuery } from '@tanstack/react-query'

import { captureVideoService } from '@/services/capture-video.service'

export const activeSessionKeys = {
  all: ['capture-active-session'] as const,
  byDevice: (deviceId: string) => [...activeSessionKeys.all, deviceId] as const,
}

/** Sessão ativa vinculada ao dispositivo pareado (consultada a cada 15s). */
export function useActiveCaptureSession(
  deviceId: string | undefined,
  installationId: string | undefined,
) {
  return useQuery({
    queryKey: activeSessionKeys.byDevice(deviceId ?? ''),
    queryFn: () => captureVideoService.getActiveSession(deviceId ?? '', installationId ?? ''),
    enabled: Boolean(deviceId && installationId),
    refetchInterval: 15_000,
  })
}
