import { ArrowLeft, CalendarDays, MapPin, PlayCircle, Trophy } from 'lucide-react'

import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { PlayerVideoCard } from '@/modules/player/components/player-video-card'
import { usePlayerMatch, usePlayerMatchVideos } from '@/modules/player/hooks/use-player'
import { sportLabel } from '@/modules/player/utils/player-labels'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

function MatchDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export function PlayerMatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: match, isLoading, isError, refetch } = usePlayerMatch(id ?? '')
  const {
    data: videos,
    isLoading: videosLoading,
    isError: videosError,
  } = usePlayerMatchVideos(id ?? '')

  if (isLoading) {
    return <MatchDetailSkeleton />
  }

  if (isError || !match) {
    return (
      <ErrorState message="Não foi possível carregar a partida." onRetry={() => void refetch()} />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(appPaths.player)}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="space-y-2">
        <MatchStatusBadge status={match.status} />
        <h1 className="text-2xl font-semibold tracking-tight">{match.title}</h1>
        <p className="text-muted-foreground text-sm">{sportLabel(match.sport)}</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          <InfoRow
            icon={MapPin}
            label="Arena"
            value={[match.arenaName, match.arenaCity].filter(Boolean).join(' — ') || 'Arena não definida'}
          />
          <InfoRow icon={Trophy} label="Quadra" value={match.courtName ?? '—'} />
          <InfoRow
            icon={CalendarDays}
            label="Data"
            value={formatDateTime(match.scheduledAt ?? match.startedAt ?? match.createdAt)}
          />
          <InfoRow
            icon={PlayCircle}
            label="Vídeos disponíveis"
            value={`${match.readyVideoCount} de ${match.videoCount}`}
          />
        </CardContent>
      </Card>

      {match.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre a partida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{match.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Gravações</h2>

        {videosLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : null}

        {!videosLoading && videosError ? (
          <ErrorState message="Não foi possível carregar as gravações." />
        ) : null}

        {!videosLoading && !videosError && videos && videos.length > 0 ? (
          <div className="flex flex-col gap-5">
            {[...new Set(videos.map((video) => video.cameraName ?? 'Gravações sem câmera'))].map((camera) => (
              <div key={camera} className="space-y-2">
                <h3 className="text-sm font-semibold">{camera}</h3>
                <div className="flex flex-col gap-3">
                  {videos.filter((video) => (video.cameraName ?? 'Gravações sem câmera') === camera).map((video) => (
                    <PlayerVideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!videosLoading && !videosError && videos && videos.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="Nenhuma gravação"
            description="Esta partida ainda não possui vídeos disponíveis."
          />
        ) : null}
      </section>
    </div>
  )
}
