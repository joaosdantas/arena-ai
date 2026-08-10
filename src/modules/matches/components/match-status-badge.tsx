import type { ComponentType } from 'react'

import { CalendarCheck2, CheckCircle2, Loader2, Upload, Video, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { MATCH_STATUS_LABELS, type MatchStatus } from '@/modules/matches/types/match.types'

const statusConfig: Record<
  MatchStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: ComponentType<{ className?: string }>
  }
> = {
  created: { variant: 'secondary', icon: CalendarCheck2 },
  recording: { variant: 'default', icon: Video },
  uploading: { variant: 'outline', icon: Upload },
  processing: { variant: 'outline', icon: Loader2 },
  ready: { variant: 'default', icon: CheckCircle2 },
  failed: { variant: 'destructive', icon: XCircle },
}

interface MatchStatusBadgeProps {
  status: MatchStatus
}

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className="size-3" />
      {MATCH_STATUS_LABELS[status]}
    </Badge>
  )
}
