import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/common/loading-state'

import { useAuth } from '@/contexts/AuthContext'

import { appPaths } from '@/routes/paths'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState label="Carregando..." className="min-h-dvh" />
  }

  if (!user) {
    return <Navigate to={appPaths.login} replace />
  }

  return <Outlet />
}
