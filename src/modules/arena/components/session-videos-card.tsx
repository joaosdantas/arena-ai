import { Clock, Film, Loader2, UploadCloud } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type {
  SessionVideoView,
  VideoProcessingStatus,
} from '@/modules/arena/types/arena-dashboard.types'

const VIDEO_STATUS_LABELS: Record<VideoProcessingStatus, string> = {
  uploading: 'Enviando',
  pending: 'Na fila',
  processing: 'Processando',
  ready: 'Pronto',
  failed: 'Falha',
}

function isInlineImage(value: string | null): boolean {
  return Boolean(
    value &&
      (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('http')),
  )
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

function VideoStatusPill({ status }: { status: VideoProcessingStatus }) {
  const variants: Record<VideoProcessingStatus, string> = {
    uploading: 'bg-sky-500/10 text-sky-600',
    pending: 'text-muted-foreground bg-muted',
    processing: 'bg-amber-500/10 text-amber-600',
    ready: 'bg-emerald-500/10 text-emerald-600',
    failed: 'bg-red-500/10 text-red-600',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variants[status]}`}
    >
      {status === 'uploading' ? <UploadCloud className="size-3" /> : null}
      {status === 'processing' ? <Loader2 className="size-3 animate-spin" /> : null}
      {VIDEO_STATUS_LABELS[status]}
    </span>
  )
}

export function SessionVideosCard({ videos }: { videos: SessionVideoView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="text-muted-foreground size-4" />
          Gravações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma gravação ainda. Ative uma sessão e grave pelo celular pareado.
          </p>
        ) : (
          videos.map((video) => {
            const thumbnail = isInlineImage(video.thumbnailUrl) ? video.thumbnailUrl : undefined
            return (
              <div
                key={video.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt="Miniatura da gravação"
                    className="size-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="bg-muted flex size-16 shrink-0 items-center justify-center rounded-md">
                    <Film className="text-muted-foreground size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      Gravação #{video.id.slice(0, 8)}
                    </span>
                    <VideoStatusPill status={video.status} />
                  </div>
                  <div className="text-muted-foreground flex items-center gap-3 text-xs">
                    {video.duration ? (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {video.duration}s
                      </span>
                    ) : null}
                    {formatFileSize(video.fileSize) ? (
                      <span>{formatFileSize(video.fileSize)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
