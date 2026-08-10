import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface AuthFormProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthForm({ title, description, children, footer, className }: AuthFormProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children}
      {footer ? (
        <div className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
