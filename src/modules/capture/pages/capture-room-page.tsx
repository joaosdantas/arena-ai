import { useMemo, useState } from 'react'

import { Loader2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { CaptureHeader } from '@/modules/capture/components/capture-header'
import { useCaptureRoom, useJoinCaptureRoom } from '@/modules/capture/hooks/use-capture-room'
import { getOrCreateCaptureInstallationId } from '@/modules/capture/utils/capture-installation'

import { appPaths } from '@/routes/paths'

export function CaptureRoomPage() {
  const { roomToken } = useParams<{ roomToken: string }>()
  const navigate = useNavigate()
  const installationId = useMemo(() => getOrCreateCaptureInstallationId(), [])
  const [deviceName, setDeviceName] = useState('Celular')
  const roomQuery = useCaptureRoom(roomToken)
  const joinRoom = useJoinCaptureRoom()

  function handleJoin() {
    if (!roomToken) return
    joinRoom.mutate(
      { roomToken, installationId, deviceName },
      {
        onSuccess: (deviceId) => navigate(appPaths.captureDevice(deviceId), { replace: true }),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : 'Não foi possível entrar na sala. Ela pode ter sido encerrada.',
          ),
      },
    )
  }

  const room = roomQuery.data

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center px-4 py-6">
      <CaptureHeader />
      <main className="flex w-full max-w-md flex-1 flex-col justify-center gap-4">
        {roomQuery.isLoading ? <LoadingState label="Abrindo sala..." className="min-h-64" /> : null}
        {roomQuery.isError ? (
          <ErrorState
            message="Não foi possível abrir esta sala."
            onRetry={() => void roomQuery.refetch()}
          />
        ) : null}
        {!roomQuery.isLoading && !roomQuery.isError && !room ? (
          <ErrorState message="Link inválido ou sala encerrada." />
        ) : null}
        {room ? (
          <Card>
            <CardHeader>
              <div className="text-sm text-muted-foreground">
                {room.arenaName} · {room.courtName}
              </div>
              <CardTitle className="text-2xl">Entrar na sala de captura</CardTitle>
              <CardDescription>
                Seu celular será conectado à sessão para gravar ou enviar vídeos. Até 10
                dispositivos podem entrar; qualquer pessoa com o link poderá participar enquanto a
                sala estiver aberta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="grid gap-2 text-sm font-medium">
                Nome deste dispositivo
                <Input
                  maxLength={64}
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="Ex.: Celular lateral"
                />
              </label>
              <Button
                size="lg"
                className="w-full"
                disabled={joinRoom.isPending || !deviceName.trim()}
                onClick={handleJoin}
              >
                {joinRoom.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Smartphone className="size-5" />
                )}
                {joinRoom.isPending ? 'Conectando...' : 'Entrar na sala'}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
