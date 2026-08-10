import { Camera, LayoutGrid } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

import { CourtStatusBadge } from '@/modules/arena/components/arena-status-badge'
import type { CourtView } from '@/modules/arena/types/arena-dashboard.types'

export function CourtCard({ court }: { court: CourtView }) {
  const cameraLabel = court.deviceCount === 1 ? 'câmera instalada' : 'câmeras instaladas'

  return (
    <Card className="gap-4">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-muted-foreground size-4" />
            <h3 className="font-semibold">{court.name}</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            {court.sport ?? 'Modalidade não definida'}
          </p>
        </div>
        <CourtStatusBadge status={court.status} />
      </CardContent>
      <CardContent className="pt-0">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Camera className="size-4" />
          {court.deviceCount} {cameraLabel}
        </div>
      </CardContent>
    </Card>
  )
}
