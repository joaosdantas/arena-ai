import { CalendarDays, ChevronRight, MapPin, Plus, Trophy } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { NewMatchFab } from '@/components/layout/new-match-fab'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useAuth } from '@/contexts/AuthContext'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { RecentMatchCard } from '@/modules/matches/components/recent-match-card'
import { SportIcon } from '@/modules/matches/components/sport-icon'
import { useMatches } from '@/modules/matches/hooks/use-matches'
import { type Match, SPORT_LABELS } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

function getFirstName(name?: string | null): string {
  if (!name) return 'atleta'
  return name.trim().split(/\s+/)[0]
}

function getNextMatch(matches: Match[]): Match | undefined {
  const now = Date.now()
  return (
    matches.find(
      (match) =>
        match.status === 'created' &&
        match.scheduledAt &&
        new Date(match.scheduledAt).getTime() > now,
    ) ??
    matches.find((match) => match.status === 'created') ??
    matches[0]
  )
}

function getRecentMatches(matches: Match[]): Match[] {
  return [...matches]
    .sort((a, b) => {
      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 4)
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: matches, isLoading, isError, refetch } = useMatches()

  const nextMatch = matches ? getNextMatch(matches) : undefined
  const recentMatches = matches ? getRecentMatches(matches) : []

  const displayName = profile?.fullName || profile?.email || 'atleta'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Olá, {getFirstName(displayName)}</h1>
        </div>
        <Button className="hidden md:inline-flex" onClick={() => navigate(appPaths.matchesNew)}>
          <Plus className="size-4" />
          Nova partida
        </Button>
      </div>

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <ErrorState
          message="Não foi possível carregar suas partidas."
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && matches && matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Bora jogar"
          description="Crie a sua primeira partida para registrar gravações, acompanhar o time e compartilhar com quem importa."
          action={
            <Button
              size="lg"
              className="bg-brand text-brand-foreground"
              onClick={() => navigate(appPaths.matchesNew)}
            >
              <Plus className="size-4" />
              Criar primeira partida
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && nextMatch ? (
        <section className="from-primary via-emerald-700 to-emerald-900 relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -right-6 -bottom-8 opacity-20">
            <CalendarDays className="size-40" strokeWidth={1.2} />
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-brand text-xs font-bold tracking-widest uppercase">
                Próxima partida
              </p>
              <MatchStatusBadge status={nextMatch.status} />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <SportIcon sport={nextMatch.sport} className="text-brand size-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-lg font-bold sm:text-xl">{nextMatch.title}</h2>
                <p className="text-white/80 text-sm">{SPORT_LABELS[nextMatch.sport]}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {nextMatch.arena?.name ?? 'Arena não definida'}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatDateTime(nextMatch.scheduledAt)}
              </span>
            </div>

            <Button
              size="lg"
              className="bg-brand text-brand-foreground w-fit hover:bg-brand/90"
              onClick={() => navigate(appPaths.matchDetail(nextMatch.id))}
            >
              Continuar partida
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {!isLoading && !isError && matches && matches.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Últimas partidas</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => navigate(appPaths.matches)}
            >
              Ver todas
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {recentMatches.map((match) => (
              <RecentMatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ) : null}

      <NewMatchFab />
    </div>
  )
}
