import { Clock, Film } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SessionDetail } from '@/modules/arena/types/arena-dashboard.types'
import { formatTimelineTime, getVideoTimelinePosition, orderVideosByTimeline } from '@/modules/arena/services/video-timeline.service'

const statusLabel: Record<SessionDetail['videos'][number]['status'], string> = {
  uploading: 'Enviando', pending: 'Na fila', processing: 'Processando', ready: 'Pronto', failed: 'Falha',
}

export function SessionTimelineCard({ session }: { session: SessionDetail }) {
  const videos = orderVideosByTimeline(session.videos, session)
  const positions = videos.map((video) => getVideoTimelinePosition(video, session))
  const totalMs = Math.max(
    1,
    ...positions.map((position) => position.endMs),
    session.startedAt && session.endedAt ? Date.parse(session.endedAt) - Date.parse(session.startedAt) : 0,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Film className="size-4 text-muted-foreground" />Timeline das câmeras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {videos.length === 0 ? <p className="text-sm text-muted-foreground">As gravações desta sessão aparecerão aqui.</p> : (
          <>
            <div className="flex justify-between font-mono text-xs text-muted-foreground"><span>00:00.000</span><span>{formatTimelineTime(totalMs)}</span></div>
            <div className="space-y-4">
              {videos.map((video) => {
                const position = getVideoTimelinePosition(video, session)
                const left = Math.min(100, position.startMs / totalMs * 100)
                const width = Math.max(1, Math.min(100 - left, position.durationMs / totalMs * 100))
                return (
                  <div key={video.id} className="grid gap-1.5 sm:grid-cols-[minmax(9rem,1fr)_2fr] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{video.cameraName ?? 'Câmera'}</p>
                      <p className="text-xs text-muted-foreground">{statusLabel[video.status]}</p>
                    </div>
                    <div>
                      <div className="bg-muted relative h-3 overflow-hidden rounded-full" role="img" aria-label={`${video.cameraName ?? 'Câmera'} grava de ${formatTimelineTime(position.startMs)} até ${formatTimelineTime(position.endMs)}`}>
                        <div className="bg-primary absolute top-0 h-full rounded-full" style={{ left: `${left}%`, width: `${width}%` }} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="size-3" />Início {formatTimelineTime(position.startMs)}</span>
                        <span>Duração {formatTimelineTime(position.durationMs)}</span>
                        <span>Fim {formatTimelineTime(position.endMs)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
