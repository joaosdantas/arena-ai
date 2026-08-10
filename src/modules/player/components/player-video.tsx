import { Loader2, TriangleAlert } from 'lucide-react'

import { VideoPlayer } from '@/modules/videos/components/video-player'
import type { PlayerVideo } from '@/modules/player/types/player.types'

interface PlayerVideoProps {
  video: PlayerVideo
}

export function PlayerVideoBlock({ video }: PlayerVideoProps) {
  if (video.status === 'ready' && video.url) {
    return <VideoPlayer src={video.url} poster={video.thumbnailUrl ?? undefined} />
  }

  if (video.status === 'processing' || video.status === 'pending' || video.status === 'uploading') {
    return (
      <div className="bg-muted/60 text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border text-center">
        <Loader2 className="size-7 animate-spin" />
        <div className="space-y-1 px-6">
          <p className="text-sm font-medium">Seu vídeo está sendo processado.</p>
          <p className="text-xs">O vídeo ficará disponível em breve. Tente novamente em alguns instantes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/60 text-muted-foreground flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border text-center">
      <TriangleAlert className="size-7" />
      <p className="px-6 text-sm">Não foi possível carregar o vídeo.</p>
    </div>
  )
}
