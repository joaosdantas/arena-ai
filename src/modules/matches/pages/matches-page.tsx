import { Plus, Trophy } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'

import { MatchCard } from '@/modules/matches/components/match-card'
import { MatchCardSkeleton } from '@/modules/matches/components/match-card-skeleton'
import { useMatches } from '@/modules/matches/hooks/use-matches'

import { appPaths } from '@/routes/paths'

export function MatchesPage() {
  const navigate = useNavigate()
  const { data: matches, isLoading, isError, refetch } = useMatches()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Minhas partidas"
        description="Acompanhe e gerencie as partidas registradas."
        actions={
          <Button onClick={() => navigate(appPaths.matchesNew)}>
            <Plus className="size-4" />
            Nova partida
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          message="Não foi possível carregar as partidas."
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && matches && matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhuma partida registrada"
          description="Comece criando a sua primeira partida para organizar gravações e resultados."
          action={
            <Button onClick={() => navigate(appPaths.matchesNew)}>
              <Plus className="size-4" />
              Criar partida
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
