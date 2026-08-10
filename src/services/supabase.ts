import { type SupabaseClient, createClient } from '@supabase/supabase-js'

import { env } from '@/lib/env'

import type { Database } from '@/types/database'

const hasSupabaseCredentials = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)

export const supabase: SupabaseClient<Database> | null = hasSupabaseCredentials
  ? createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  : null

export function isSupabaseConfigured(): boolean {
  return supabase !== null
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.',
    )
  }
  return supabase
}

export async function getRequiredUserId(): Promise<string> {
  const client = getSupabase()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    throw new Error('Usuário não autenticado.')
  }
  return data.user.id
}
