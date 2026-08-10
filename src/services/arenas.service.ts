import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type { ArenaRow, CreateArenaInput } from '@/types/arenas'

export const MOCK_ARENAS: ArenaRow[] = [
  {
    id: 'arena-municipal',
    name: 'Arena Municipal',
    owner_id: null,
    slug: 'arena-municipal',
    city: 'São Paulo',
    state: 'SP',
    address: 'Av. Principal, 1000',
    cover_url: null,
    status: 'active',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'ginasio-central',
    name: 'Ginásio Central',
    owner_id: null,
    slug: 'ginasio-central',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address: 'Rua das Quadras, 250',
    cover_url: null,
    status: 'active',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'campo-santos',
    name: 'Campo dos Santos',
    owner_id: null,
    slug: 'campo-santos',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Alameda do Campo, 77',
    cover_url: null,
    status: 'active',
    created_at: '2026-07-01T10:00:00.000Z',
    updated_at: '2026-07-01T10:00:00.000Z',
  },
]

export const arenasService = {
  async getArenas(): Promise<ArenaRow[]> {
    if (!isSupabaseConfigured()) {
      return MOCK_ARENAS
    }
    const { data, error } = await getSupabase()
      .from('arenas')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async createArena(input: CreateArenaInput): Promise<ArenaRow> {
    if (!isSupabaseConfigured()) {
      return {
        id: crypto.randomUUID(),
        name: input.name,
        owner_id: null,
        slug: input.slug ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        address: input.address ?? null,
        cover_url: input.coverUrl ?? null,
        status: input.status ?? 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    const { data, error } = await getSupabase()
      .from('arenas')
      .insert({
        name: input.name,
        city: input.city ?? null,
        address: input.address ?? null,
        cover_url: input.coverUrl ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
