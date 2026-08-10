import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { MatchActions } from '@/modules/matches/components/match-actions'
import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { type Match, SPORT_LABELS } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

interface MatchHeaderProps {
  match: Match
  onDelete: () => void
  isDeleting?: boolean
}

export function MatchHeader({ match, onDelete, isDeleting }: MatchHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(appPaths.matches)}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{match.title}</h1>
            <MatchStatusBadge status={match.status} />
          </div>
          <p className="text-muted-foreground text-sm">{SPORT_LABELS[match.sport]}</p>
        </div>

        <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDateTime(match.scheduledAt)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="size-4" />
            {match.arena?.name ?? 'Arena não definida'}
          </span>
        </div>

        <MatchActions match={match} onDelete={onDelete} isDeleting={isDeleting} />
      </div>
    </div>
  )
}
