import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/common/loading-state'

import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

import { appPaths } from '@/routes/paths'

export function ArenaAccessGuard() {
  const { data: arena, isLoading } = useCurrentArena()

  if (isLoading) {
    return <LoadingState label="Carregando arena..." className="min-h-dvh" />
  }

  if (!arena) {
    return <Navigate to={appPaths.arenaNew} replace />
  }

  return <Outlet />
}
