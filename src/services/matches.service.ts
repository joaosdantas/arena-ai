import { getRequiredUserId, getSupabase } from '@/services/supabase'

import type { CreateMatchInput, MatchRow, MatchUpdate, MatchWithRelations } from '@/types/matches'

export const matchesService = {
  async createMatch(input: CreateMatchInput): Promise<MatchWithRelations> {
    const userId = await getRequiredUserId()
    const { data, error } = await getSupabase()
      .from('matches')
      .insert({
        owner_id: userId,
        arena_id: input.arenaId ?? null,
        title: input.title,
        sport: input.sport,
        status: 'created',
        is_public: input.isPublic ?? false,
        description: input.description ?? null,
        scheduled_at: input.scheduledAt ?? null,
      })
      .select('*, arena:arenas(*)')
      .single()

    if (error) throw error
    return data
  },

  async getMyMatches(): Promise<MatchWithRelations[]> {
    const userId = await getRequiredUserId()
    const { data, error } = await getSupabase()
      .from('matches')
      .select('*, arena:arenas(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getMatchById(id: string): Promise<MatchWithRelations | null> {
    const { data, error } = await getSupabase()
      .from('matches')
      .select('*, arena:arenas(*)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async updateMatch(id: string, updates: MatchUpdate): Promise<MatchWithRelations> {
    const { data, error } = await getSupabase()
      .from('matches')
      .update(updates)
      .eq('id', id)
      .select('*, arena:arenas(*)')
      .single()

    if (error) throw error
    return data
  },

  async updateMatchStatus(id: string, status: MatchRow['status']): Promise<MatchWithRelations> {
    return this.updateMatch(id, { status })
  },

  async deleteMatch(id: string): Promise<void> {
    const { error } = await getSupabase().from('matches').delete().eq('id', id)
    if (error) throw error
  },
}
