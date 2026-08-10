import { CalendarDays, MapPin, Play, TriangleAlert, Trophy } from 'lucide-react'
import { useRef } from 'react'

import { useParams } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'

import {
  ShareVideoButton,
  WhatsAppVideoButton,
} from '@/modules/player/components/share-video-button'
import { usePublicVideo } from '@/modules/player/hooks/use-player'
import { sportLabel } from '@/modules/player/utils/player-labels'
import { VideoPlayer } from '@/modules/videos/components/video-player'

import { formatDateTime } from '@/utils/format'

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

export function PublicWatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  const playerRef = useRef<HTMLDivElement | null>(null)
  const { data: video, isLoading, isError, refetch } = usePublicVideo(videoId ?? '')

  function handleWatch() {
    const container = playerRef.current
    if (!container) return
    container.scrollIntoView({ behavior: 'smooth', block: 'center' })
    container.querySelector('video')?.play()
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center px-4 py-6">
      <a href="/" aria-label="Arena AI">
        <BrandLogo />
      </a>

      <main className="mt-6 flex w-full max-w-lg flex-col gap-5">
        {isLoading ? <LoadingState label="Carregando vídeo..." /> : null}

        {isError ? (
          <ErrorState message="Não foi possível carregar o vídeo." onRetry={() => void refetch()} />
        ) : null}

        {!isLoading && !isError && !video ? (
          <ErrorState message="Vídeo não encontrado ou ainda não disponível publicamente." />
        ) : null}

        {video ? (
          <>
            <div ref={playerRef} className="flex flex-col gap-3 scroll-mt-24">
              {video.status === 'ready' && video.playbackUrl ? (
                <VideoPlayer src={video.playbackUrl} poster={video.thumbnailUrl ?? undefined} />
              ) : (
                <div className="bg-muted/60 text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border text-center">
                  <TriangleAlert className="size-7" />
                  <p className="px-6 text-sm">
                    {video.status === 'processing' || video.status === 'pending'
                      ? 'Seu vídeo está sendo processado.'
                      : 'Este vídeo não está disponível no momento.'}
                  </p>
                </div>
              )}
              {video.status === 'ready' && video.playbackUrl ? (
                <Button size="lg" onClick={handleWatch}>
                  <Play className="size-5 fill-current" />
                  Assistir
                </Button>
              ) : null}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">{video.matchTitle ?? 'Vídeo'}</h1>
              <p className="text-muted-foreground text-sm">{sportLabel(video.sport)}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <InfoRow icon={MapPin} label="Arena" value={video.arenaName ?? '—'} />
              <InfoRow icon={Trophy} label="Quadra" value={video.courtName ?? '—'} />
              <InfoRow
                icon={CalendarDays}
                label="Data"
                value={formatDateTime(video.scheduledAt)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <ShareVideoButton
                title={video.matchTitle ?? 'Vídeo Arena AI'}
                videoId={video.videoId}
                className="flex-1"
              />
              <WhatsAppVideoButton
                title={video.matchTitle ?? 'Vídeo Arena AI'}
                videoId={video.videoId}
                className="flex-1"
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
