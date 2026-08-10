import type { ComponentType } from 'react'

import { Clapperboard, Share2, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate, useParams } from 'react-router-dom'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { MatchHeader } from '@/modules/matches/components/match-header'
import { MatchVideoSection } from '@/modules/matches/components/match-video-section'
import { useDeleteMatch, useMatch, useUpdateMatchStatus } from '@/modules/matches/hooks/use-matches'
import {
  MATCH_STATUSES,
  MATCH_STATUS_LABELS,
  type MatchStatus,
} from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { shareMatch } from '@/utils/share'

const futureSections: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}[] = [
  {
    icon: Clapperboard,
    title: 'Melhores momentos',
    description: 'Os destaques da partida aparecerão aqui em breve.',
  },
  {
    icon: Users,
    title: 'Jogadores',
    description: 'A lista de atletas participantes aparecerá em breve.',
  },
  {
    icon: Trophy,
    title: 'Estatísticas',
    description: 'Números e análise da partida aparecerão em breve.',
  },
]

function MatchDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-3/4 sm:w-1/2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
    </div>
  )
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: match, isLoading, isError, refetch } = useMatch(id ?? '')
  const updateStatus = useUpdateMatchStatus(id ?? '')
  const deleteMatch = useDeleteMatch()

  if (isLoading) {
    return <MatchDetailSkeleton />
  }

  if (isError || !match) {
    return (
      <ErrorState message="Não foi possível carregar a partida." onRetry={() => void refetch()} />
    )
  }

  const currentMatch = match

  function handleStatusChange(status: MatchStatus) {
    updateStatus.mutate(status, {
      onSuccess: () => toast.success('Status da partida atualizado!'),
      onError: (error) => toast.error(error.message),
    })
  }

  function handleDelete() {
    if (!window.confirm('Deseja excluir esta partida?')) return
    deleteMatch.mutate(currentMatch.id, {
      onSuccess: () => {
        toast.success('Partida excluída.')
        navigate(appPaths.matches)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  function handleShare() {
    void shareMatch(currentMatch)
      .then((result) => {
        toast.success(result === 'copied' ? 'Link copiado!' : 'Compartilhamento aberto.')
      })
      .catch(() => {
        toast.error('Não foi possível compartilhar esta partida.')
      })
  }

  return (
    <div className="flex flex-col gap-6">
      <MatchHeader
        match={currentMatch}
        onDelete={handleDelete}
        isDeleting={deleteMatch.isPending}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status da partida</CardTitle>
          <CardDescription>
            Atualize a etapa atual do fluxo de captura e processamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currentMatch.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {MATCH_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentMatch.status === 'ready' ? (
        <Card className="from-primary via-emerald-700 to-emerald-900 border-none bg-gradient-to-br text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="size-4" />
              Partida pronta!
            </CardTitle>
            <CardDescription className="text-white/80">
              Compartilhe a gravação com o time e a torcida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
              Compartilhar partida
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <MatchVideoSection matchId={currentMatch.id} />

      {currentMatch.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre a partida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{currentMatch.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {futureSections.map((section) => (
          <EmptyState key={section.title} {...section} />
        ))}
      </div>
    </div>
  )
}
