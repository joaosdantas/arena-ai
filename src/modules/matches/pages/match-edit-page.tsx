import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { Button } from '@/components/ui/button'

import { MatchForm } from '@/modules/matches/components/match-form'
import { useMatch, useUpdateMatch } from '@/modules/matches/hooks/use-matches'
import type { MatchFormInput } from '@/modules/matches/schemas/match.schema'
import { isSportType } from '@/modules/matches/schemas/match.schema'

import { appPaths } from '@/routes/paths'

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function MatchEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: match, isLoading, isError, refetch } = useMatch(id ?? '')
  const updateMutation = useUpdateMatch(id ?? '')

  if (isLoading) {
    return <LoadingState label="Carregando partida..." />
  }

  if (isError || !match) {
    return (
      <ErrorState message="Não foi possível carregar a partida." onRetry={() => void refetch()} />
    )
  }

  const currentMatch = match

  const defaultValues: MatchFormInput = {
    title: currentMatch.title,
    sport: isSportType(currentMatch.sport) ? currentMatch.sport : 'other',
    arenaId: currentMatch.arenaId ?? '',
    description: currentMatch.description ?? '',
    scheduledDate: toDatetimeLocal(currentMatch.scheduledAt),
  }

  function handleSubmit(values: MatchFormInput) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Partida atualizada com sucesso!')
        navigate(appPaths.matchDetail(currentMatch.id))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(appPaths.matchDetail(match.id))}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Editar partida</h1>
        <p className="text-muted-foreground text-sm">Atualize as informações da partida.</p>
      </div>

      <MatchForm
        defaultValues={defaultValues}
        submitLabel="Salvar alterações"
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={() => navigate(appPaths.matchDetail(match.id))}
      />
    </div>
  )
}
