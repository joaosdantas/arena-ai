import type { ComponentType, ReactNode } from 'react'

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
      </div>
      {action}
    </div>
  )
}
