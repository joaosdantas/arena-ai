import { useQuery } from '@tanstack/react-query'

import { captureDeviceService } from '@/services/capture-device.service'

export const captureDeviceKeys = {
  all: ['capture-device'] as const,
  pairing: (pairingToken: string) => [...captureDeviceKeys.all, 'pairing', pairingToken] as const,
  byId: (deviceId: string) => [...captureDeviceKeys.all, 'by-id', deviceId] as const,
}

export function useCaptureDevice(pairingToken: string | undefined, installationId: string) {
  return useQuery({
    queryKey: captureDeviceKeys.pairing(pairingToken ?? ''),
    queryFn: () => captureDeviceService.getByPairingToken(pairingToken ?? '', installationId),
    enabled: Boolean(pairingToken),
  })
}

export function useCaptureDeviceById(deviceId: string | undefined, installationId: string) {
  return useQuery({
    queryKey: captureDeviceKeys.byId(deviceId ?? ''),
    queryFn: () => captureDeviceService.getByDeviceId(deviceId ?? '', installationId),
    enabled: Boolean(deviceId),
  })
}
