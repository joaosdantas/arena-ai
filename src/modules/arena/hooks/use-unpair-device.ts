import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toast } from 'sonner'

import { arenaDashboardKeys } from '@/modules/arena/hooks/use-arena'

import { captureDeviceService } from '@/services/capture-device.service'

export function useUnpairDevice(arenaId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deviceId: string) => captureDeviceService.unpairDevice(deviceId),
    onSuccess: () => {
      toast.success('Dispositivo desconectado')
      if (arenaId) {
        void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.devices(arenaId) })
        void queryClient.invalidateQueries({ queryKey: arenaDashboardKeys.summary(arenaId) })
      }
    },
    onError: () => {
      toast.error('Não foi possível desconectar o dispositivo')
    },
  })
}
