import { Swords } from 'lucide-react'

import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  collapsed?: boolean
}

export function BrandLogo({ className, collapsed = false }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Swords className="size-4" />
      </div>
      {!collapsed ? <span className="text-sm font-semibold tracking-tight">Arena AI</span> : null}
    </div>
  )
}
