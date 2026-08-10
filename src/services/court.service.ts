import { getSupabase } from '@/services/supabase'

import type { Court, CourtUpdate, CreateCourtInput } from '@/types/domain'

export const courtService = {
  async create(input: CreateCourtInput): Promise<Court> {
    const { data, error } = await getSupabase()
      .from('courts')
      .insert({
        arena_id: input.arenaId,
        name: input.name,
        sport: input.sport ?? null,
        status: input.status ?? 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async get(id: string): Promise<Court | null> {
    const { data, error } = await getSupabase()
      .from('courts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async list(): Promise<Court[]> {
    const { data, error } = await getSupabase()
      .from('courts')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async listByArena(arenaId: string): Promise<Court[]> {
    const { data, error } = await getSupabase()
      .from('courts')
      .select('*')
      .eq('arena_id', arenaId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async update(id: string, updates: CourtUpdate): Promise<Court> {
    const { data, error } = await getSupabase()
      .from('courts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
