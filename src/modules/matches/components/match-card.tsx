import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { type Match, SPORT_LABELS } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

interface MatchCardProps {
  match: Match
}

export function MatchCard({ match }: MatchCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="hover:border-ring/50 cursor-pointer gap-3 transition-colors"
      onClick={() => navigate(appPaths.matchDetail(match.id))}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold leading-snug">{match.title}</h3>
          <p className="text-muted-foreground text-sm">{SPORT_LABELS[match.sport]}</p>
        </div>
        <MatchStatusBadge status={match.status} />
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <CalendarDays className="size-4" />
          <span>{formatDateTime(match.scheduledAt)}</span>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <MapPin className="size-4" />
          <span>{match.arena?.name ?? 'Arena não definida'}</span>
        </div>
      </CardContent>

      <div className="text-muted-foreground flex items-center gap-1 border-t px-6 pt-3 pb-2 text-sm">
        Ver detalhes
        <ChevronRight className="size-3.5" />
      </div>
    </Card>
  )
}
