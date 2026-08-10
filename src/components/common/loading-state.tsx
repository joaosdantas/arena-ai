import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Carregando...', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin" />
      <span>{label}</span>
    </div>
  )
}
