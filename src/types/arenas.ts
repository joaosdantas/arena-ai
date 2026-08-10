import type { Database, Tables } from '@/types/database'

export type ArenaRow = Tables<'arenas'>
export type ArenaInsert = Database['public']['Tables']['arenas']['Insert']
export type ArenaUpdate = Database['public']['Tables']['arenas']['Update']

export interface CreateArenaInput {
  name: string
  ownerId?: string | null
  slug?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  coverUrl?: string | null
  status?: 'active' | 'inactive'
}
