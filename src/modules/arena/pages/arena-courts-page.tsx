import { LayoutGrid } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'

import { CourtCard } from '@/modules/arena/components/court-card'
import { useCourts } from '@/modules/arena/hooks/use-courts'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

export function ArenaCourtsPage() {
  const { data: arena } = useCurrentArena()
  const { data: courts, isLoading } = useCourts(arena?.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quadras"
        description="Gerencie as quadras da sua arena"
      />

      {isLoading ? (
        <LoadingState label="Carregando quadras..." className="min-h-64" />
      ) : courts && courts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="Nenhuma quadra cadastrada"
          description="Cadastre uma quadra para vincular câmeras e registrar sessões."
        />
      )}
    </div>
  )
}
