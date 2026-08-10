import { CalendarDays, ChevronRight } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { SportIcon } from '@/modules/matches/components/sport-icon'
import { type Match, SPORT_LABELS } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { formatDate } from '@/utils/format'

interface RecentMatchCardProps {
  match: Match
}

export function RecentMatchCard({ match }: RecentMatchCardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(appPaths.matchDetail(match.id))}
      className="hover:bg-accent/60 group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors"
    >
      <div
        className={cn(
          'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary via-emerald-700 to-emerald-900',
        )}
      >
        {match.thumbnailUrl ? (
          <img
            src={match.thumbnailUrl}
            alt={match.title}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <SportIcon sport={match.sport} className="text-brand size-7" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold">{match.title}</p>
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarDays className="size-3.5" />
          <span className="truncate">
            {SPORT_LABELS[match.sport]} • {formatDate(match.scheduledAt)}
          </span>
        </p>
        <MatchStatusBadge status={match.status} />
      </div>

      <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0" />
    </button>
  )
}
