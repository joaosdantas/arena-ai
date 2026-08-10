import { Camera, Film, LayoutGrid, Trophy, Video } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'
import { StatCard } from '@/components/common/stat-card'

import { CaptureDeviceStatus } from '@/modules/arena/components/capture-device-status'
import { SessionCard } from '@/modules/arena/components/session-card'
import { useArenaDashboard } from '@/modules/arena/hooks/use-arena-dashboard'
import { useCaptureDevices } from '@/modules/arena/hooks/use-capture-devices'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'
import { useSessions } from '@/modules/arena/hooks/use-sessions'

export function ArenaDashboardPage() {
  const { data: arena } = useCurrentArena()
  const { data: summary, isLoading } = useArenaDashboard(arena?.id)
  const { data: devices } = useCaptureDevices(arena?.id)
  const { data: sessions } = useSessions(arena?.id)

  if (isLoading || !summary) {
    return <LoadingState label="Carregando dashboard..." className="min-h-64" />
  }

  const recentSessions = (sessions ?? []).slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader
        title={arena?.name ?? 'Painel da Arena'}
        description="Visão geral da operação de captura"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Quadras"
          value={summary.courtCount}
          icon={LayoutGrid}
          hint="Quadras ativas na arena"
        />
        <StatCard
          label="Câmeras conectadas"
          value={summary.activeDeviceCount}
          icon={Camera}
          hint={`de ${summary.deviceCount} dispositivos`}
        />
        <StatCard
          label="Sessões hoje"
          value={summary.sessionsTodayCount}
          icon={Video}
          hint="Gravadas e agendadas"
        />
        <StatCard
          label="Partidas realizadas"
          value={summary.matchesCount}
          icon={Trophy}
          hint={`${summary.videosProcessedCount} vídeos processados`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="text-muted-foreground size-4" />
              Status dos dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices && devices.length > 0 ? (
              devices.slice(0, 5).map((device) => (
                <CaptureDeviceStatus key={device.id} device={device} />
              ))
            ) : (
              <EmptyState
                icon={Camera}
                title="Nenhum dispositivo"
                description="Cadastre uma câmera para começar a capturar partidas."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Film className="text-muted-foreground size-4" />
              Sessões recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))
            ) : (
              <EmptyState
                icon={Film}
                title="Sem sessões recentes"
                description="As sessões de captura das suas quadras aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
