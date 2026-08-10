import { Navigate } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { LoadingState } from '@/components/common/loading-state'

import { NewArenaWizard } from '@/modules/arena/components/new-arena-wizard'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

import { appPaths } from '@/routes/paths'

export function NewArenaPage() {
  const { data: arena, isLoading } = useCurrentArena()

  if (isLoading) {
    return <LoadingState label="Carregando..." className="min-h-dvh" />
  }

  if (arena) {
    return <Navigate to={appPaths.arena} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-center border-b px-4 md:justify-start md:px-6">
        <BrandLogo />
      </header>
      <main className="flex flex-1 items-start justify-center p-4 pb-16 pt-10 md:p-8 md:pt-14">
        <NewArenaWizard />
      </main>
    </div>
  )
}
