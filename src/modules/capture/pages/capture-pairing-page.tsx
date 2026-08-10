import { useMemo } from 'react'

import { Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { CaptureHeader } from '@/modules/capture/components/capture-header'
import { useCaptureDevice } from '@/modules/capture/hooks/use-capture-device'
import { usePairCaptureDevice } from '@/modules/capture/hooks/use-capture-pairing'
import { getOrCreateCaptureInstallationId } from '@/modules/capture/utils/capture-installation'

import { appPaths } from '@/routes/paths'

export function CapturePairingPage() {
  const { pairingToken } = useParams<{ pairingToken: string }>()
  const navigate = useNavigate()

  const installationId = useMemo(() => getOrCreateCaptureInstallationId(), [])

  const deviceQuery = useCaptureDevice(pairingToken, installationId)
  const pairDevice = usePairCaptureDevice()

  const device = deviceQuery.data

  function handleConnect() {
    if (!pairingToken) return
    pairDevice.mutate(
      { pairingToken, installationId },
      {
        onSuccess: (paired) => {
          if (!paired) {
            toast.error('Não foi possível conectar este celular a esta câmera.')
            return
          }
          if (device) {
            navigate(appPaths.captureDevice(device.id), { replace: true })
          }
        },
        onError: () => {
          toast.error('Não foi possível conectar este celular a esta câmera.')
        },
      },
    )
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center px-4 py-6">
      <CaptureHeader />

      <main className="flex w-full max-w-md flex-1 flex-col justify-center gap-4">
        {deviceQuery.isLoading ? (
          <LoadingState label="Buscando câmera..." className="min-h-64" />
        ) : null}

        {deviceQuery.isError ? (
          <ErrorState
            message="Não foi possível acessar esta câmera."
            onRetry={() => void deviceQuery.refetch()}
          />
        ) : null}

        {!deviceQuery.isLoading && !deviceQuery.isError && !device ? (
          <ErrorState message="QR Code inválido ou câmera não encontrada." />
        ) : null}

        {device ? (
          device.paired && !device.isMine ? (
            <Card className="text-center">
              <CardHeader className="items-center">
                <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                  <Smartphone className="text-muted-foreground size-7" />
                </div>
                <CardTitle className="text-lg">Câmera já pareada</CardTitle>
                <CardDescription>
                  Esta câmera já está conectada a outro celular. Peça para o responsável da arena
                  desconectar o dispositivo e tente novamente.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : device.isMine ? (
            <Card className="text-center">
              <CardHeader className="items-center">
                <div className="bg-emerald-500/10 flex size-14 items-center justify-center rounded-full">
                  <Smartphone className="text-emerald-500 size-7" />
                </div>
                <CardTitle className="text-lg">Celular já conectado</CardTitle>
                <CardDescription>
                  Este celular já é a câmera de <span className="font-medium">{device.name}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate(appPaths.captureDevice(device.id))}
                >
                  Abrir modo captura
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{device.arenaName}</span>
                  <span>·</span>
                  <span>{device.courtName}</span>
                </div>
                <CardTitle className="text-2xl">{device.name}</CardTitle>
                {device.position ? (
                  <CardDescription>Posição: {device.position}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-sm">
                  Este celular será usado como câmera desta quadra.
                </p>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={pairDevice.isPending}
                  onClick={handleConnect}
                >
                  <Smartphone className="size-5" />
                  {pairDevice.isPending ? 'Conectando...' : 'Conectar câmera'}
                </Button>
              </CardContent>
            </Card>
          )
        ) : null}
      </main>
    </div>
  )
}
