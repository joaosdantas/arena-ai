import { mockArenaStore } from '@/modules/arena/services/mock-arena-dashboard'

import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import { MAX_CAPTURE_ROOM_DEVICES } from '@/utils/capture'

export interface CaptureRoomInfo {
  sessionId: string
  status: string
  arenaName: string
  courtName: string
}

export const captureRoomService = {
  async open(sessionId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      const token = mockArenaStore.openCaptureRoom(sessionId)
      if (!token) throw new Error('Não foi possível abrir a sala de captura.')
      return token
    }

    const { data, error } = await getSupabase().rpc('open_capture_room', {
      p_session_id: sessionId,
    })
    if (error) throw error
    if (!data) throw new Error('Não foi possível abrir a sala de captura.')
    return data
  },

  async getToken(sessionId: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.getCaptureRoomToken(sessionId)
    }

    const { data, error } = await getSupabase().rpc('get_session_capture_room_token', {
      p_session_id: sessionId,
    })
    if (error) throw error
    return data
  },

  async close(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.closeCaptureRoom(sessionId)
    }

    const { data, error } = await getSupabase().rpc('close_capture_room', {
      p_session_id: sessionId,
    })
    if (error) throw error
    return Boolean(data)
  },

  async getByToken(roomToken: string): Promise<CaptureRoomInfo | null> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.getCaptureRoomByToken(roomToken)
    }

    const { data, error } = await getSupabase().rpc('get_capture_room_by_token', {
      p_room_token: roomToken,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) return null
    return {
      sessionId: row.session_id,
      status: row.status,
      arenaName: row.arena_name,
      courtName: row.court_name,
    }
  },

  async join(roomToken: string, installationId: string, deviceName: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      const deviceId = mockArenaStore.joinCaptureRoom(roomToken, installationId, deviceName)
      if (!deviceId) throw new Error('Esta sala não está mais disponível para entrada.')
      return deviceId
    }

    const { data, error } = await getSupabase().rpc('join_capture_room', {
      p_room_token: roomToken,
      p_installation_id: installationId,
      p_device_name: deviceName,
    })
    if (error) {
      if (error.message.includes('ROOM_DEVICE_LIMIT_REACHED')) {
        throw new Error(`A sala já atingiu o limite de ${MAX_CAPTURE_ROOM_DEVICES} dispositivos.`)
      }
      throw error
    }
    const deviceId = data?.[0]?.device_id
    if (!deviceId) throw new Error('Esta sala não está mais disponível para entrada.')
    return deviceId
  },
}
