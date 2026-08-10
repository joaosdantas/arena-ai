import { Settings } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { PageHeader } from '@/components/common/page-header'

import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

import { formatDateTime } from '@/utils/format'

export function ArenaSettingsPage() {
  const { data: arena } = useCurrentArena()

  if (!arena) return null

  const addressLine = [arena.city, arena.state].filter(Boolean).join(' / ')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Dados da sua arena"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="text-muted-foreground size-4" />
            Informações da arena
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Nome" value={arena.name} />
          <InfoRow label="Identificador" value={arena.slug ?? '—'} />
          <InfoRow label="Endereço" value={arena.address ?? '—'} />
          <InfoRow label="Cidade / UF" value={addressLine || '—'} />
          <InfoRow label="Status" value={arena.status === 'active' ? 'Ativa' : 'Inativa'} />
          <InfoRow label="Criada em" value={formatDateTime(arena.created_at)} />
        </CardContent>
      </Card>

      <p className="text-muted-foreground max-w-2xl text-sm">
        A edição dos dados da arena será implementada em uma etapa futura.
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}
