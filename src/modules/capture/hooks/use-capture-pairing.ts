import { useMutation, useQueryClient } from '@tanstack/react-query'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'
import { captureDeviceKeys } from '@/modules/capture/hooks/use-capture-device'

import { captureDeviceService } from '@/services/capture-device.service'

interface PairCaptureDeviceArgs {
  pairingToken: string
  installationId: string
}

export function usePairCaptureDevice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pairingToken, installationId }: PairCaptureDeviceArgs) =>
      captureDeviceService.pairDevice(pairingToken, installationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: captureDeviceKeys.all })
      void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.all })
    },
  })
}
