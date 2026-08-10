import { Trophy } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'

import { PlayerMatchCard } from '@/modules/player/components/player-match-card'
import { usePlayerMatches } from '@/modules/player/hooks/use-player'

function PlayerMatchesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex flex-col gap-2 rounded-xl border p-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function PlayerHomePage() {
  const { data: matches, isLoading, isError, refetch } = usePlayerMatches()

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Minhas partidas</h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe e assista às gravações das suas partidas.
        </p>
      </div>

      {isLoading ? <PlayerMatchesSkeleton /> : null}

      {isError ? (
        <ErrorState message="Não foi possível carregar as partidas." onRetry={() => void refetch()} />
      ) : null}

      {!isLoading && !isError && matches && matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhuma partida disponível"
          description="Quando houver uma partida com gravação, ela aparecerá aqui."
        />
      ) : null}

      {!isLoading && !isError && matches && matches.length > 0 ? (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <PlayerMatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
