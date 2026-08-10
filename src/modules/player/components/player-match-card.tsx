import { CalendarDays, MapPin, PlayCircle } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import type { PlayerMatch } from '@/modules/player/types/player.types'
import { sportLabel } from '@/modules/player/utils/player-labels'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

interface PlayerMatchCardProps {
  match: PlayerMatch
}

function videoCountLabel(match: PlayerMatch): string {
  if (match.readyVideoCount > 0) {
    const label = match.readyVideoCount === 1 ? 'vídeo' : 'vídeos'
    return `${match.readyVideoCount} ${label} disponível(is)`
  }
  if (match.videoCount > 0) {
    return 'Vídeo em processamento'
  }
  return 'Sem vídeos ainda'
}

export function PlayerMatchCard({ match }: PlayerMatchCardProps) {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden">
      <div
        className="bg-muted relative aspect-video cursor-pointer"
        onClick={() => navigate(appPaths.playerMatchDetail(match.id))}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            navigate(appPaths.playerMatchDetail(match.id))
          }
        }}
      >
        {match.thumbnailUrl ? (
          <img
            src={match.thumbnailUrl}
            alt={`Thumbnail de ${match.title}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Sem prévia
          </div>
        )}
        <div className="absolute top-2 right-2">
          <MatchStatusBadge status={match.status} />
        </div>
      </div>

      <CardContent className="gap-4 pt-4">
        <button
          type="button"
          className="block w-full cursor-pointer text-left"
          onClick={() => navigate(appPaths.playerMatchDetail(match.id))}
        >
          <h3 className="font-semibold leading-snug">{match.title}</h3>
          <p className="text-muted-foreground mt-0.5 text-sm">{sportLabel(match.sport)}</p>
        </button>

        <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          <span className="flex items-center gap-2">
            <MapPin className="size-4" />
            {match.arenaName ?? 'Arena não definida'}
            {match.courtName ? ` · ${match.courtName}` : ''}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDateTime(match.scheduledAt ?? match.startedAt ?? match.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-muted-foreground text-sm">{videoCountLabel(match)}</span>
          <button
            type="button"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold"
            onClick={() => navigate(appPaths.playerMatchDetail(match.id))}
          >
            <PlayCircle className="size-5" />
            Assistir
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
