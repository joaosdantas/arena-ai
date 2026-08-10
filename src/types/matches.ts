import type { Database, Tables } from '@/types/database'

export type MatchRow = Tables<'matches'>
export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchUpdate = Database['public']['Tables']['matches']['Update']
export type MatchStatus = Database['public']['Enums']['match_status']

export type MatchWithRelations = MatchRow & {
  arena: Database['public']['Tables']['arenas']['Row'] | null
}

export const MATCH_STATUSES: MatchStatus[] = [
  'created',
  'recording',
  'uploading',
  'processing',
  'ready',
  'failed',
]

export interface CreateMatchInput {
  title: string
  sport: string
  arenaId?: string | null
  isPublic?: boolean
  description?: string | null
  scheduledAt?: string | null
}
