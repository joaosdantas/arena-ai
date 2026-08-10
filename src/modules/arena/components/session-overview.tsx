import { CalendarDays, Camera, CircleStop, Flag, Play, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  CaptureDeviceStatusBadge,
  SessionStatusBadge,
} from '@/modules/arena/components/arena-status-badge'
import { SessionVideosCard } from '@/modules/arena/components/session-videos-card'
import { useSessionLifecycle } from '@/modules/arena/hooks/use-session-lifecycle'
import type { SessionDetail } from '@/modules/arena/types/arena-dashboard.types'

import { formatDateTime } from '@/utils/format'

export function SessionOverview({ session }: { session: SessionDetail }) {
  const schedule = session.startedAt ?? session.createdAt
  const lifecycle = useSessionLifecycle()

  const canStart = session.status === 'scheduled'
  const canFinish = session.status === 'active' || session.status === 'processing'
  const canFail = session.status === 'active' || session.status === 'scheduled'

  function runAction(
    action: 'start' | 'finish' | 'fail',
  ) {
    lifecycle.mutate({
      sessionId: session.id,
      action,
      deviceIds: action === 'start' ? session.devices.map((device) => device.id) : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Quadra</span>
            <span className="font-medium">{session.courtName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Horário</span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="text-muted-foreground size-3.5" />
              {formatDateTime(schedule)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <SessionStatusBadge status={session.status} />
          </div>

          {session.status === 'scheduled' || session.status === 'active' || session.status === 'processing' ? (
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              {canStart ? (
                <Button
                  size="sm"
                  disabled={lifecycle.isPending}
                  onClick={() => runAction('start')}
                >
                  <Play className="size-4" />
                  Iniciar sessão
                </Button>
              ) : null}
              {canFinish ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={lifecycle.isPending}
                  onClick={() => runAction('finish')}
                >
                  <CircleStop className="size-4" />
                  Encerrar
                </Button>
              ) : null}
              {canFail ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={lifecycle.isPending}
                  onClick={() => runAction('fail')}
                >
                  <Flag className="size-4" />
                  Marcar falha
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="text-muted-foreground size-4" />
              Dispositivos conectados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.devices.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum dispositivo vinculado.</p>
            ) : (
              session.devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{device.name}</span>
                  <CaptureDeviceStatusBadge status={device.status} presence={device.presence} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-muted-foreground size-4" />
              Partidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.matches.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma partida vinculada.</p>
            ) : (
              session.matches.map((match) => (
                <div key={match.id} className="space-y-0.5 rounded-md border px-3 py-2">
                  <p className="truncate text-sm font-medium">{match.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {match.sport || 'Modalidade não definida'} · {match.status}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <SessionVideosCard videos={session.videos} />
      </div>
    </div>
  )
}
