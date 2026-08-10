import type { ComponentType } from 'react'

import { Card, CardContent } from '@/components/ui/card'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  hint?: string
  className?: string
}

export function StatCard({ label, value, icon: Icon, hint, className }: StatCardProps) {
  return (
    <Card className={cn('gap-3 py-5', className)}>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
