import type { Match, MatchFormData, MatchStatus } from '@/modules/matches/types/match.types'

import { MOCK_ARENAS } from '@/services/arenas.service'

const MOCK_MATCHES_KEY = 'arena-ai:mock-matches'

function toMatchArena(arenaId: string | null) {
  const arena = MOCK_ARENAS.find((item) => item.id === arenaId)
  if (!arena) return null
  return {
    id: arena.id,
    name: arena.name,
    city: arena.city,
    address: arena.address,
    coverUrl: arena.cover_url,
  }
}

function seedMatches(ownerId: string): Match[] {
  const municipal = MOCK_ARENAS[0]
  const ginasio = MOCK_ARENAS[1]

  return [
    {
      id: 'mock-match-1',
      ownerId,
      arenaId: municipal.id,
      title: 'Semifinal — Furacão FC vs. Atlético Real',
      sport: 'football',
      status: 'ready',
      isPublic: true,
      description: 'Partida decisiva pela semifinal do campeonato.',
      scheduledAt: '2026-08-01T19:00:00.000Z',
      startedAt: '2026-08-01T19:05:00.000Z',
      finishedAt: '2026-08-01T21:00:00.000Z',
      thumbnailUrl: null,
      videoUrl: null,
      previewUrl: null,
      createdAt: '2026-07-20T10:00:00.000Z',
      arena: toMatchArena(municipal.id),
    },
    {
      id: 'mock-match-2',
      ownerId,
      arenaId: ginasio.id,
      title: 'Clássico da Cidade',
      sport: 'basketball',
      status: 'created',
      isPublic: false,
      description: 'O clássico mais aguardado do ano.',
      scheduledAt: '2026-08-15T20:00:00.000Z',
      startedAt: null,
      finishedAt: null,
      thumbnailUrl: null,
      videoUrl: null,
      previewUrl: null,
      createdAt: '2026-07-25T10:00:00.000Z',
      arena: toMatchArena(ginasio.id),
    },
    {
      id: 'mock-match-3',
      ownerId,
      arenaId: municipal.id,
      title: 'Jogo 3 — Final',
      sport: 'volleyball',
      status: 'recording',
      isPublic: true,
      description: 'Partida que pode decidir o campeonato.',
      scheduledAt: '2026-08-06T21:00:00.000Z',
      startedAt: '2026-08-06T21:10:00.000Z',
      finishedAt: null,
      thumbnailUrl: null,
      videoUrl: null,
      previewUrl: null,
      createdAt: '2026-07-28T10:00:00.000Z',
      arena: toMatchArena(municipal.id),
    },
  ]
}

function readAll(): Match[] {
  const raw = localStorage.getItem(MOCK_MATCHES_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Match[]) : []
  } catch {
    return []
  }
}

function persist(list: Match[]): void {
  localStorage.setItem(MOCK_MATCHES_KEY, JSON.stringify(list))
}

function ensureSeeded(ownerId: string): Match[] {
  const stored = readAll()
  if (stored.length > 0) return stored
  const seeded = seedMatches(ownerId)
  persist(seeded)
  return seeded
}

export const mockMatchStore = {
  list(ownerId: string): Match[] {
    return ensureSeeded(ownerId).filter((match) => match.ownerId === ownerId)
  },

  byId(id: string): Match | null {
    return readAll().find((match) => match.id === id) ?? null
  },

  create(input: MatchFormData, ownerId: string): Match {
    const match: Match = {
      id: crypto.randomUUID(),
      ownerId,
      arenaId: input.arenaId,
      title: input.title,
      sport: input.sport,
      status: 'created',
      isPublic: false,
      description: input.description.trim() || null,
      scheduledAt: input.scheduledDate ? new Date(input.scheduledDate).toISOString() : null,
      startedAt: null,
      finishedAt: null,
      thumbnailUrl: null,
      videoUrl: null,
      previewUrl: null,
      createdAt: new Date().toISOString(),
      arena: toMatchArena(input.arenaId),
    }
    persist([match, ...readAll()])
    return match
  },

  update(id: string, patch: Partial<MatchFormData>): Match | null {
    const list = readAll()
    const index = list.findIndex((match) => match.id === id)
    if (index === -1) return null

    const current = list[index]
    const updated: Match = {
      ...current,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.sport !== undefined ? { sport: patch.sport } : {}),
      ...(patch.arenaId !== undefined
        ? { arenaId: patch.arenaId, arena: toMatchArena(patch.arenaId) }
        : {}),
      ...(patch.description !== undefined ? { description: patch.description.trim() || null } : {}),
      ...(patch.scheduledDate !== undefined
        ? { scheduledAt: patch.scheduledDate ? new Date(patch.scheduledDate).toISOString() : null }
        : {}),
    }
    list[index] = updated
    persist(list)
    return updated
  },

  updateStatus(id: string, status: MatchStatus): Match | null {
    const list = readAll()
    const index = list.findIndex((match) => match.id === id)
    if (index === -1) return null
    const updated = { ...list[index], status }
    list[index] = updated
    persist(list)
    return updated
  },

  remove(id: string): void {
    persist(readAll().filter((match) => match.id !== id))
  },
}
