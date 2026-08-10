import type { User } from '@supabase/supabase-js'

import * as React from 'react'

import { authService } from '@/modules/auth/services/auth.service'
import { getProfile } from '@/modules/profile/services/profile.service'
import type { UserProfile } from '@/modules/profile/types/profile'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true

    void authService
      .getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (!user) return

    let active = true

    void getProfile(user.id)
      .then((currentProfile) => {
        if (active) {
          setProfile(currentProfile ? { ...currentProfile, email: user.email ?? '' } : null)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [user])

  const signIn = React.useCallback(async (email: string, password: string) => {
    const signedInUser = await authService.signIn(email, password)
    setUser(signedInUser)
  }, [])

  const signOut = React.useCallback(async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = React.useCallback(async () => {
    if (!user) return
    const currentProfile = await getProfile(user.id)
    setProfile(currentProfile ? { ...currentProfile, email: user.email ?? '' } : null)
  }, [user])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, profile, loading, signIn, signOut, refreshProfile }),
    [user, profile, loading, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
