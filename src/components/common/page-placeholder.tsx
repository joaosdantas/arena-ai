import type { ComponentType } from 'react'

interface PagePlaceholderProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  children?: React.ReactNode
}

export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-10 text-center">
      <div className="bg-muted flex size-14 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
      </div>
      {children}
    </div>
  )
}
