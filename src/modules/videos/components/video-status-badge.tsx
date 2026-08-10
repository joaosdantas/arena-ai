import type { ComponentType } from 'react'

import { CheckCircle2, Clock, Loader2, UploadCloud, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { VIDEO_STATUS_LABELS, type VideoStatus } from '@/modules/videos/types/video.types'

const statusConfig: Record<
  VideoStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: ComponentType<{ className?: string }>
  }
> = {
  pending: { variant: 'secondary', icon: Clock },
  uploading: { variant: 'default', icon: UploadCloud },
  processing: { variant: 'outline', icon: Loader2 },
  ready: { variant: 'default', icon: CheckCircle2 },
  failed: { variant: 'destructive', icon: XCircle },
}

interface VideoStatusBadgeProps {
  status: VideoStatus
}

export function VideoStatusBadge({ status }: VideoStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className="size-3" />
      {VIDEO_STATUS_LABELS[status]}
    </Badge>
  )
}
