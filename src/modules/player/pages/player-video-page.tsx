import { ArrowLeft, CalendarDays, Camera, MapPin, Trophy } from 'lucide-react'

import { useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { PlayerVideoBlock } from '@/modules/player/components/player-video'
import {
  ShareVideoButton,
  WhatsAppVideoButton,
} from '@/modules/player/components/share-video-button'
import { usePlayerVideo } from '@/modules/player/hooks/use-player'
import { sportLabel } from '@/modules/player/utils/player-labels'
import { VideoStatusBadge } from '@/modules/videos/components/video-status-badge'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

function InfoRow({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <p className="min-w-0">
        <span className="text-muted-foreground text-xs">{label} </span>
        <span className="truncate text-sm font-medium">{value}</span>
      </p>
    </div>
  )
}

export function PlayerVideoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: video, isLoading, isError, refetch } = usePlayerVideo(id ?? '')

  if (isLoading) {
    return <LoadingState label="Carregando vídeo..." />
  }

  if (isError) {
    return <ErrorState message="Não foi possível carregar o vídeo." onRetry={() => void refetch()} />
  }

  if (!video) {
    return <ErrorState message="Vídeo não encontrado." />
  }

  const isReady = video.status === 'ready'

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() =>
          navigate(video.matchId ? appPaths.playerMatchDetail(video.matchId) : appPaths.player)
        }
      >
        <ArrowLeft className="size-4" />
        {video.matchId ? 'Voltar para a partida' : 'Voltar para minhas partidas'}
      </Button>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{video.matchTitle ?? 'Vídeo'}</h1>
          <VideoStatusBadge status={video.status} />
        </div>
        <p className="text-muted-foreground text-sm">{sportLabel(video.sport)}</p>
      </div>

      <PlayerVideoBlock video={video} />

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <InfoRow icon={MapPin} label="Arena" value={video.arenaName ?? '—'} />
          <InfoRow icon={Trophy} label="Quadra" value={video.courtName ?? '—'} />
          <InfoRow
            icon={CalendarDays}
            label="Data"
            value={formatDateTime(video.scheduledAt ?? video.createdAt)}
          />
          <InfoRow icon={Camera} label="Câmera" value={video.cameraName ?? '—'} />
        </CardContent>
      </Card>

      {isReady ? (
        <div className="grid grid-cols-2 gap-2">
          <ShareVideoButton title={video.matchTitle ?? 'Vídeo Arena AI'} videoId={video.id} />
          <WhatsAppVideoButton title={video.matchTitle ?? 'Vídeo Arena AI'} videoId={video.id} />
        </div>
      ) : null}
    </div>
  )
}
