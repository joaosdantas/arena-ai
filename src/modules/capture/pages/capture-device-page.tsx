import { useMemo } from 'react'

import { MapPin, QrCode, Smartphone } from 'lucide-react'

import { useParams } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { CaptureHeader } from '@/modules/capture/components/capture-header'
import { CaptureRecorder } from '@/modules/capture/components/capture-recorder'
import { useActiveCaptureSession } from '@/modules/capture/hooks/use-active-session'
import { useCaptureDeviceById } from '@/modules/capture/hooks/use-capture-device'
import { useCaptureHeartbeat } from '@/modules/capture/hooks/use-capture-heartbeat'
import { getOrCreateCaptureInstallationId } from '@/modules/capture/utils/capture-installation'

import type { CapturePresence } from '@/types/domain'

function presenceLabel(presence: CapturePresence): string {
  return presence === 'online' ? 'Conectada' : 'Desconectada'
}

export function CaptureDevicePage() {
  const { id } = useParams<{ id: string }>()

  const installationId = useMemo(() => getOrCreateCaptureInstallationId(), [])

  const deviceQuery = useCaptureDeviceById(id, installationId)
  const device = deviceQuery.data

  const { data: activeSession, refetch: refetchActiveSession } = useActiveCaptureSession(
    device?.isMine ? device.id : undefined,
    device?.isMine ? installationId : undefined,
  )

  const { presence } = useCaptureHeartbeat(
    device?.isMine ? device.id : null,
    device?.isMine ? installationId : null,
  )

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center px-4 py-6">
      <CaptureHeader />

      <main className="flex w-full max-w-md flex-1 flex-col justify-center gap-4">
        {deviceQuery.isLoading ? (
          <LoadingState label="Verificando dispositivo..." className="min-h-64" />
        ) : null}

        {deviceQuery.isError ? (
          <ErrorState message="Não foi possível carregar o dispositivo." />
        ) : null}

        {!deviceQuery.isLoading && !deviceQuery.isError && !device ? (
          <ErrorState message="Dispositivo não encontrado." />
        ) : null}

        {device && !device.paired ? (
          <Card className="text-center">
            <CardHeader className="items-center">
              <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                <QrCode className="text-muted-foreground size-7" />
              </div>
              <CardTitle className="text-lg">Dispositivo não pareado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Este celular ainda não está conectado a esta câmera. Escaneie o QR Code instalado no
                suporte físico da câmera para conectar.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {device && device.paired && !device.isMine ? (
          <Card className="text-center">
            <CardHeader className="items-center">
              <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                <Smartphone className="text-muted-foreground size-7" />
              </div>
              <CardTitle className="text-lg">Conectado a outro celular</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground text-sm">
                Esta câmera está pareada com outro celular. Peça ao responsável da arena para
                desconectar o dispositivo e depois escaneie o QR Code novamente.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {device && device.isMine ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{device.arenaName}</span>
                  <span>·</span>
                  <span>{device.courtName}</span>
                </div>
                <CardTitle className="text-2xl">{device.name}</CardTitle>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {device.position ?? 'Posição não definida'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-2 rounded-lg border py-2">
                  <span
                    className={`size-2.5 rounded-full ${
                      presence === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{presenceLabel(presence)}</span>
                </div>
              </CardContent>
            </Card>

            <CaptureRecorder
              deviceId={device.id}
              installationId={installationId}
              activeSession={activeSession}
              onUploaded={() => void refetchActiveSession()}
            />
          </>
        ) : null}
      </main>
    </div>
  )
}
