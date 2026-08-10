import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center gap-3 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <AlertCircle className="text-destructive size-6" />
      </div>
      <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
