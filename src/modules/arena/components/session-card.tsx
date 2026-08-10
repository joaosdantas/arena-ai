import { CalendarDays, ChevronRight } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'

import { SessionStatusBadge } from '@/modules/arena/components/arena-status-badge'
import type { SessionView } from '@/modules/arena/types/arena-dashboard.types'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

export function SessionCard({ session }: { session: SessionView }) {
  const navigate = useNavigate()
  const schedule = session.startedAt ?? session.createdAt

  return (
    <button
      type="button"
      onClick={() => navigate(appPaths.arenaSessionDetail(session.id))}
      className="w-full text-left"
    >
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium">{session.courtName}</p>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <CalendarDays className="size-3.5" />
              {formatDateTime(schedule)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SessionStatusBadge status={session.status} />
            <ChevronRight className="text-muted-foreground size-4" />
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
