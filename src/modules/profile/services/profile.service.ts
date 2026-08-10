import {
  type MockSession,
  mockDelay,
  readMockSession,
  writeMockSession,
} from '@/modules/auth/services/mock-session'
import type { UserProfile } from '@/modules/profile/types/profile'

import { storageService } from '@/services/storage.service'
import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export interface SaveProfileInput {
  fullName: string
  avatarUrl?: string | null
}

function toProfile(session: MockSession): UserProfile {
  return {
    id: session.id,
    fullName: session.fullName,
    email: session.email,
    avatarUrl: session.avatarUrl,
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    const session = readMockSession()
    return session && session.id === userId ? toProfile(session) : null
  }

  const { data, error } = await getSupabase()
    .from('users')
    .select('id, name, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    fullName: data.name,
    email: '',
    avatarUrl: data.avatar_url,
  }
}

export async function updateProfile(userId: string, input: SaveProfileInput): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    await mockDelay()
    const current = readMockSession()
    const updated: MockSession = {
      id: current?.id ?? userId,
      email: current?.email ?? '',
      createdAt: current?.createdAt ?? new Date().toISOString(),
      fullName: input.fullName,
      avatarUrl: input.avatarUrl ?? null,
    }
    writeMockSession(updated)
    return toProfile(updated)
  }

  const { error } = await getSupabase()
    .from('users')
    .update({ name: input.fullName, avatar_url: input.avatarUrl ?? null })
    .eq('id', userId)
  if (error) throw error

  return {
    id: userId,
    fullName: input.fullName,
    email: '',
    avatarUrl: input.avatarUrl ?? null,
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!isSupabaseConfigured()) {
    return readFileAsDataUrl(file)
  }
  const extension = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/${Date.now()}.${extension}`
  await storageService.uploadFile('avatars', path, file)
  return storageService.getPublicUrl('avatars', path)
}
