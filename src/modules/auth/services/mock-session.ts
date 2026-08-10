import type { User } from '@supabase/supabase-js'

export const MOCK_SESSION_KEY = 'arena-ai:mock-session'

export interface MockSession {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  createdAt: string
}

export function readMockSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    return raw ? (JSON.parse(raw) as MockSession) : null
  } catch {
    return null
  }
}

export function writeMockSession(session: MockSession | null): void {
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY)
  }
}

export function createMockSession(email: string, fullName = ''): MockSession {
  return {
    id: `mock-${Date.now().toString(36)}`,
    email,
    fullName,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  }
}

export function buildMockUser(session: MockSession): User {
  const now = new Date().toISOString()
  return {
    id: session.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: session.email,
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {},
    user_metadata: {
      full_name: session.fullName,
      avatar_url: session.avatarUrl,
    },
    identities: [],
    created_at: session.createdAt,
    updated_at: now,
    is_anonymous: false,
  }
}

export function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400))
}
