import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/common/loading-state'

import { useAuth } from '@/contexts/AuthContext'

import { appPaths } from '@/routes/paths'

export function PublicRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState label="Verificando sessão..." className="min-h-dvh" />
  }

  if (user) {
    return <Navigate to={appPaths.dashboard} replace />
  }

  return <Outlet />
}
