import { ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'

import { UploadVideo } from '@/modules/videos/components/upload-video'
import { VideoPlayer } from '@/modules/videos/components/video-player'
import { VideoStatusBadge } from '@/modules/videos/components/video-status-badge'
import { useDeleteVideo, useMatchVideo } from '@/modules/videos/hooks/use-videos'

import { appPaths } from '@/routes/paths'

interface MatchVideosSectionProps {
  matchId: string
}

export function MatchVideosSection({ matchId }: MatchVideosSectionProps) {
  const navigate = useNavigate()
  const { data: video, isLoading, isError, refetch } = useMatchVideo(matchId)
  const deleteVideo = useDeleteVideo(matchId)

  function handleDelete() {
    if (!video) return
    if (!window.confirm('Deseja excluir este vídeo?')) return
    deleteVideo.mutate(video, {
      onSuccess: () => toast.success('Vídeo excluído.'),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Verificando vídeo...
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          message="Não foi possível carregar o vídeo da partida."
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && video ? (
        <div className="flex flex-col gap-3">
          {video.url ? (
            <VideoPlayer src={video.url} poster={video.thumbnailUrl ?? undefined} />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <VideoStatusBadge status={video.status} />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(appPaths.videoDetail(video.id))}
              >
                <ExternalLink className="size-4" />
                Página do vídeo
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteVideo.isPending}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && !video ? (
        <div className="flex flex-col gap-3">
          <p className="font-medium">Adicione a gravação da partida</p>
          <UploadVideo matchId={matchId} />
        </div>
      ) : null}
    </div>
  )
}
