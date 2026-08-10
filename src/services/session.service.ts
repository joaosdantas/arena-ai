import { mockArenaStore } from '@/modules/arena/services/mock-arena-dashboard'

import { getRequiredUserId, getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type { CreateSessionInput, Session, SessionStatus, SessionUpdate } from '@/types/domain'

export const sessionService = {
  async create(input: CreateSessionInput): Promise<Session> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.createSession(input)
    }

    const userId = await getRequiredUserId()
    const { data, error } = await getSupabase()
      .from('sessions')
      .insert({
        court_id: input.courtId,
        started_at: input.startedAt ?? null,
        ended_at: input.endedAt ?? null,
        status: input.status ?? 'scheduled',
        created_by: input.createdBy ?? userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async get(id: string): Promise<Session | null> {
    if (!isSupabaseConfigured()) return mockArenaStore.getSession(id)

    const { data, error } = await getSupabase()
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async list(): Promise<Session[]> {
    if (!isSupabaseConfigured()) return mockArenaStore.listSessions()

    const { data, error } = await getSupabase()
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async listByCourt(courtId: string): Promise<Session[]> {
    if (!isSupabaseConfigured()) return mockArenaStore.listSessionsByCourt(courtId)

    const { data, error } = await getSupabase()
      .from('sessions')
      .select('*')
      .eq('court_id', courtId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async update(id: string, updates: SessionUpdate): Promise<Session> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.updateSession(id, updates)
    }

    const { data, error } = await getSupabase()
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}

// -----------------------------------------------------------------------------
// Ciclo de vida: transições de status da Session e vínculo com dispositivo.
// -----------------------------------------------------------------------------

function isSessionStatus(value: string): value is SessionStatus {
  return value === 'scheduled' || value === 'active' || value === 'processing' || value === 'finished' || value === 'failed'
}

async function refreshSession(sessionId: string): Promise<Session> {
  const session = await sessionService.get(sessionId)
  if (!session) throw new Error('Sessão não encontrada.')
  return session
}

export const sessionLifecycleService = {
  async start(sessionId: string): Promise<Session> {
    if (!isSupabaseConfigured()) return mockArenaStore.startSession(sessionId)

    const session = await sessionService.get(sessionId)
    if (!session) throw new Error('Sessão não encontrada.')

    const { data, error } = await getSupabase()
      .from('sessions')
      .update({ status: 'active', started_at: session.started_at ?? new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async fail(sessionId: string): Promise<Session> {
    if (!isSupabaseConfigured()) return mockArenaStore.failSession(sessionId)

    const { data, error } = await getSupabase()
      .from('sessions')
      .update({ status: 'failed', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** Encerra a sessão recalculando o status a partir dos vídeos associados. */
  async finish(sessionId: string): Promise<Session> {
    if (!isSupabaseConfigured()) return mockArenaStore.finishSession(sessionId)

    const { error } = await getSupabase().rpc('recalculate_session_status', {
      p_session_id: sessionId,
    })
    if (error) throw error
    return refreshSession(sessionId)
  },

  /** Recalcula o status a partir dos vídeos (usado quando um vídeo muda). */
  async recalculate(sessionId: string): Promise<Session> {
    if (!isSupabaseConfigured()) return mockArenaStore.recalculateSession(sessionId)

    const { error } = await getSupabase().rpc('recalculate_session_status', {
      p_session_id: sessionId,
    })
    if (error) throw error
    return refreshSession(sessionId)
  },

  async setStatus(sessionId: string, status: SessionStatus): Promise<Session> {
    const session = await sessionService.get(sessionId)
    if (!session) throw new Error('Sessão não encontrada.')

    if (status === 'active') return sessionLifecycleService.start(sessionId)
    if (status === 'failed') return sessionLifecycleService.fail(sessionId)
    if (status === 'processing' || status === 'finished') {
      return sessionLifecycleService.finish(sessionId)
    }

    return sessionService.update(sessionId, { status })
  },

  /** Vincula um dispositivo à sessão (a sessão controla a gravação nele). */
  async attachDevice(sessionId: string, deviceId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      mockArenaStore.attachDevice(sessionId, deviceId)
      return
    }

    const { error } = await getSupabase()
      .from('capture_devices')
      .update({ session_id: sessionId })
      .eq('id', deviceId)
    if (error) throw error
  },

  async detachDevice(sessionId: string, deviceId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      mockArenaStore.detachDevice(sessionId, deviceId)
      return
    }

    const { error } = await getSupabase()
      .from('capture_devices')
      .update({ session_id: null })
      .eq('id', deviceId)
      .eq('session_id', sessionId)
    if (error) throw error
  },
}

export function isSessionStatusValue(value: string): value is SessionStatus {
  return isSessionStatus(value)
}
