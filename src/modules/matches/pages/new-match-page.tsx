import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { CreateMatchWizard } from '@/modules/matches/components/create-match-wizard'
import { useCreateMatch } from '@/modules/matches/hooks/use-matches'
import type { MatchFormInput } from '@/modules/matches/schemas/match.schema'

import { appPaths } from '@/routes/paths'

export function NewMatchPage() {
  const navigate = useNavigate()
  const createMutation = useCreateMatch()

  function handleSubmit(values: MatchFormInput) {
    createMutation.mutate(values, {
      onSuccess: (match) => {
        toast.success('Partida criada com sucesso!')
        navigate(appPaths.matchDetail(match.id))
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
        onClick={() => navigate(appPaths.matches)}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nova partida</h1>
        <p className="text-muted-foreground text-sm">
          Preencha os dados básicos e confirme. Você poderá adicionar a gravação depois.
        </p>
      </div>

      <CreateMatchWizard isSubmitting={createMutation.isPending} onSubmit={handleSubmit} />
    </div>
  )
}
