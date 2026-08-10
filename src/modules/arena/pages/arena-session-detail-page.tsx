import { ArrowLeft } from 'lucide-react'

import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'

import { SessionOverview } from '@/modules/arena/components/session-overview'
import { useSession } from '@/modules/arena/hooks/use-sessions'

import { appPaths } from '@/routes/paths'

export function ArenaSessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isLoading } = useSession(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(appPaths.arenaSessions)}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
      </div>

      <PageHeader
        title={session ? `Sessão · ${session.courtName}` : 'Sessão'}
        description="Detalhes da sessão de captura"
      />

      {isLoading ? (
        <LoadingState label="Carregando sessão..." className="min-h-64" />
      ) : session ? (
        <SessionOverview session={session} />
      ) : null}
    </div>
  )
}
