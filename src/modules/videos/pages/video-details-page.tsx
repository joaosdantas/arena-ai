import type { ComponentType } from 'react'

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Clapperboard,
  Film,
  MapPin,
  Trophy,
} from 'lucide-react'

import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { VideoPlayer } from '@/modules/videos/components/video-player'
import { VideoStatusBadge } from '@/modules/videos/components/video-status-badge'
import { useVideo } from '@/modules/videos/hooks/use-videos'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

const placeholderBlocks: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}[] = [
  {
    icon: Clapperboard,
    title: 'Highlights',
    description: 'Os melhores momentos gerados aparecerão aqui.',
  },
  {
    icon: Film,
    title: 'Clips',
    description: 'Recortes da partida serão listados aqui.',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas',
    description: 'Métricas e análise esportiva virão em breve.',
  },
]

export function VideoDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: video, isLoading, isError, refetch } = useVideo(id ?? '')

  if (isLoading) {
    return <LoadingState label="Carregando vídeo..." />
  }

  if (isError || !video) {
    return (
      <ErrorState message="Não foi possível carregar o vídeo." onRetry={() => void refetch()} />
    )
  }

  const currentVideo = video

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(appPaths.matchDetail(currentVideo.matchId))}
      >
        <ArrowLeft className="size-4" />
        Voltar para a partida
      </Button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Vídeo da partida</h1>
          <p className="text-muted-foreground text-sm">
            {currentVideo.match?.title ?? 'Partida sem título'}
          </p>
        </div>
        <VideoStatusBadge status={currentVideo.status} />
      </div>

      {currentVideo.url ? (
        <VideoPlayer src={currentVideo.url} poster={currentVideo.thumbnailUrl ?? undefined} />
      ) : currentVideo.thumbnailUrl ? (
        <img
          src={currentVideo.thumbnailUrl}
          alt="Thumbnail do vídeo"
          className="aspect-video w-full rounded-xl border object-cover"
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Trophy className="size-4" />
            <span>{currentVideo.match?.title ?? '—'}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <CalendarDays className="size-4" />
            <span>{formatDateTime(currentVideo.match?.scheduledAt ?? null)}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin className="size-4" />
            <span>{currentVideo.match?.arenaName ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderBlocks.map((block) => (
          <EmptyState key={block.title} {...block} />
        ))}
      </div>
    </div>
  )
}
