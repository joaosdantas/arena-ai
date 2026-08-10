import { mockDelay, readMockSession } from '@/modules/auth/services/mock-session'
import { mockMatchStore } from '@/modules/matches/services/mock-matches'
import type {
  Match,
  MatchArena,
  MatchFormData,
  MatchStatus,
  SportType,
} from '@/modules/matches/types/match.types'

import { matchesService } from '@/services/matches.service'
import { isSupabaseConfigured } from '@/services/supabase'

import type { ArenaRow } from '@/types/arenas'
import type { MatchUpdate, MatchWithRelations } from '@/types/matches'

function toMatchArena(arena: ArenaRow): MatchArena {
  return {
    id: arena.id,
    name: arena.name,
    city: arena.city,
    address: arena.address,
    coverUrl: arena.cover_url,
  }
}

function toMatch(row: MatchWithRelations): Match {
  return {
    id: row.id,
    ownerId: row.owner_id,
    arenaId: row.arena_id,
    title: row.title,
    sport: row.sport as SportType,
    status: row.status,
    isPublic: row.is_public,
    description: row.description,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    thumbnailUrl: row.thumbnail_url,
    videoUrl: row.video_url,
    previewUrl: row.preview_url,
    createdAt: row.created_at,
    arena: row.arena ? toMatchArena(row.arena) : null,
  }
}

function toCreateInput(input: MatchFormData) {
  return {
    title: input.title,
    sport: input.sport,
    arenaId: input.arenaId,
    description: input.description.trim() || null,
    scheduledAt: input.scheduledDate ? new Date(input.scheduledDate).toISOString() : null,
  }
}

function toUpdateInput(input: Partial<MatchFormData>): MatchUpdate {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.sport !== undefined ? { sport: input.sport } : {}),
    ...(input.arenaId !== undefined ? { arena_id: input.arenaId } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
    ...(input.scheduledDate !== undefined
      ? { scheduled_at: input.scheduledDate ? new Date(input.scheduledDate).toISOString() : null }
      : {}),
  }
}

function currentMockUserId(): string {
  return readMockSession()?.id ?? ''
}

export const matchService = {
  async getMyMatches(): Promise<Match[]> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      return mockMatchStore.list(currentMockUserId())
    }
    const rows = await matchesService.getMyMatches()
    return rows.map(toMatch)
  },

  async getMatchById(id: string): Promise<Match | null> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      return mockMatchStore.byId(id)
    }
    const row = await matchesService.getMatchById(id)
    return row ? toMatch(row) : null
  },

  async createMatch(input: MatchFormData): Promise<Match> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const ownerId = currentMockUserId()
      if (!ownerId) throw new Error('Usuário não autenticado.')
      return mockMatchStore.create(input, ownerId)
    }
    const row = await matchesService.createMatch(toCreateInput(input))
    return toMatch(row)
  },

  async updateMatch(id: string, input: Partial<MatchFormData>): Promise<Match> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const updated = mockMatchStore.update(id, input)
      if (!updated) throw new Error('Partida não encontrada.')
      return updated
    }
    const row = await matchesService.updateMatch(id, toUpdateInput(input))
    return toMatch(row)
  },

  async updateMatchStatus(id: string, status: MatchStatus): Promise<Match> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      const updated = mockMatchStore.updateStatus(id, status)
      if (!updated) throw new Error('Partida não encontrada.')
      return updated
    }
    const row = await matchesService.updateMatchStatus(id, status)
    return toMatch(row)
  },

  async deleteMatch(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      await mockDelay()
      mockMatchStore.remove(id)
      return
    }
    await matchesService.deleteMatch(id)
  },
}
