import { useState } from 'react'

import { Plus, Video } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'

import { NewSessionSheet } from '@/modules/arena/components/new-session-sheet'
import { SessionCard } from '@/modules/arena/components/session-card'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'
import { useSessions } from '@/modules/arena/hooks/use-sessions'

import { SESSION_STATUS_LABELS } from '@/modules/arena/types/arena-dashboard.types'
import type { SessionStatus, SessionView } from '@/modules/arena/types/arena-dashboard.types'

import { cn } from '@/lib/utils'

const FILTERS: (SessionStatus | 'all')[] = [
  'all',
  'scheduled',
  'active',
  'processing',
  'finished',
  'failed',
]

function filterLabel(status: SessionStatus | 'all'): string {
  if (status === 'all') return 'Todas'
  return SESSION_STATUS_LABELS[status]
}

export function ArenaSessionsPage() {
  const { data: arena } = useCurrentArena()
  const { data: sessions, isLoading } = useSessions(arena?.id)
  const [filter, setFilter] = useState<SessionStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered: SessionView[] = (sessions ?? []).filter((session) =>
    filter === 'all' ? true : session.status === filter,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Sessões"
          description="Sessões de captura das suas quadras"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nova sessão
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              filter === item
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {filterLabel(item)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Carregando sessões..." className="min-h-64" />
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Video}
          title="Nenhuma sessão encontrada"
          description="Não há sessões para o filtro selecionado."
        />
      )}

      <NewSessionSheet
        arenaId={arena?.id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
