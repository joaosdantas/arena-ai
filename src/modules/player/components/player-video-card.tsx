import { Play, Video } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Card } from '@/components/ui/card'

import type { PlayerVideo } from '@/modules/player/types/player.types'
import { VideoStatusBadge } from '@/modules/videos/components/video-status-badge'

import { appPaths } from '@/routes/paths'

import { formatDuration } from '@/utils/format'
import { formatTimelineTime } from '@/modules/arena/services/video-timeline.service'

interface PlayerVideoCardProps {
  video: PlayerVideo
}

export function PlayerVideoCard({ video }: PlayerVideoCardProps) {
  const navigate = useNavigate()

  const canPlay = video.status === 'ready'

  return (
    <Card
      className="cursor-pointer gap-0"
      onClick={() => {
        if (canPlay) navigate(appPaths.playerVideoDetail(video.id))
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="bg-muted relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.cameraName ?? 'Miniatura do vídeo'}
              className="size-full object-cover"
            />
          ) : (
            <Video className="text-muted-foreground size-7" />
          )}
          {canPlay ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="text-white size-8 fill-white" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-medium">{video.cameraName ?? 'Gravação'}</p>
          <p className="text-muted-foreground text-xs">
            {video.duration ? formatDuration(video.duration) : '—'}
          </p>
          <p className="text-muted-foreground text-xs">
            Início {formatTimelineTime(video.timelineOffsetMs ?? 0)}
            {video.duration !== null ? ` · Duração ${formatTimelineTime(video.duration * 1000)}` : ''}
          </p>
          <VideoStatusBadge status={video.status} />
        </div>

        {canPlay ? (
          <button
            type="button"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold"
            onClick={() => navigate(appPaths.playerVideoDetail(video.id))}
          >
            <Play className="size-4 fill-current" />
            Assistir
          </button>
        ) : null}
      </div>
    </Card>
  )
}
