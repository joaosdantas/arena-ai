import type { Session, User } from '@supabase/supabase-js'

import {
  type MockSession,
  buildMockUser,
  createMockSession,
  mockDelay,
  readMockSession,
  writeMockSession,
} from '@/modules/auth/services/mock-session'

import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

export interface SignUpOptions {
  fullName?: string
  redirectTo?: string
}

function buildMockSession(session: MockSession): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: buildMockUser(session),
  }
}

export const authService = {
  async getCurrentSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      const mockSession = readMockSession()
      return mockSession ? buildMockSession(mockSession) : null
    }
    const { data, error } = await getSupabase().auth.getSession()
    if (error) throw error
    return data.session
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      const mockSession = readMockSession()
      return mockSession ? buildMockUser(mockSession) : null
    }
    const { data, error } = await getSupabase().auth.getUser()
    if (error) throw error
    return data.user
  },

  async signIn(email: string, password: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const existing = readMockSession()
      if (existing && existing.email === email) {
        return buildMockUser(existing)
      }
      const mockSession = createMockSession(email)
      writeMockSession(mockSession)
      return buildMockUser(mockSession)
    }
    const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  },

  async signUp(email: string, password: string, options?: SignUpOptions): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const mockSession = createMockSession(email, options?.fullName ?? '')
      writeMockSession(mockSession)
      return buildMockUser(mockSession)
    }
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options?.fullName,
        },
        emailRedirectTo: options?.redirectTo,
      },
    })
    if (error) throw error
    return data.session ? data.user : null
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) {
      writeMockSession(null)
      return
    }
    const { error } = await getSupabase().auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      return
    }
    const { error } = await getSupabase().auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  async createUserProfile(user: User, fullName?: string): Promise<void> {
    if (!isSupabaseConfigured()) return
    const name =
      fullName ??
      (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '')
    const { error } = await getSupabase()
      .from('users')
      .upsert({
        id: user.id,
        name,
        avatar_url:
          typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
      })
    if (error) throw error
  },
}
