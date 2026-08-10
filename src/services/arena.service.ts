import { getRequiredUserId, getSupabase } from '@/services/supabase'

import type { Arena, ArenaUpdate, CreateArenaInput } from '@/types/domain'

export const arenaService = {
  async create(input: CreateArenaInput): Promise<Arena> {
    const userId = await getRequiredUserId()
    const { data, error } = await getSupabase()
      .from('arenas')
      .insert({
        owner_id: input.ownerId ?? userId,
        name: input.name,
        slug: input.slug ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        cover_url: input.coverUrl ?? null,
        status: input.status ?? 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async get(id: string): Promise<Arena | null> {
    const { data, error } = await getSupabase()
      .from('arenas')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async list(): Promise<Arena[]> {
    const { data, error } = await getSupabase()
      .from('arenas')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async update(id: string, updates: ArenaUpdate): Promise<Arena> {
    const { data, error } = await getSupabase()
      .from('arenas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
