import { mockArenaStore } from '@/modules/arena/services/mock-arena-dashboard'

import { getSupabase, isSupabaseConfigured } from '@/services/supabase'

import type {
  CaptureDevice,
  CaptureDevicePairingInfo,
  CaptureDeviceUpdate,
  CreateCaptureDeviceInput,
} from '@/types/domain'

import { deriveCapturePresence, generateCaptureToken } from '@/utils/capture'

function toPairingInfo(
  device: Pick<CaptureDevice, 'id' | 'name' | 'position' | 'paired' | 'capture_installation_id'>,
  courtName: string,
  arenaName: string,
  installationId: string,
): CaptureDevicePairingInfo {
  return {
    id: device.id,
    name: device.name,
    position: device.position ?? null,
    courtName,
    arenaName,
    paired: device.paired,
    isMine: device.paired && device.capture_installation_id === installationId,
  }
}

export const captureDeviceService = {
  async create(input: CreateCaptureDeviceInput): Promise<CaptureDevice> {
    const { data, error } = await getSupabase()
      .from('capture_devices')
      .insert({
        court_id: input.courtId,
        name: input.name,
        qr_code: input.qrCode,
        pairing_token: generateCaptureToken(),
        position: input.position ?? null,
        height: input.height ?? null,
        angle: input.angle ?? null,
        status: input.status ?? 'offline',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async get(id: string): Promise<CaptureDevice | null> {
    const { data, error } = await getSupabase()
      .from('capture_devices')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async list(): Promise<CaptureDevice[]> {
    const { data, error } = await getSupabase()
      .from('capture_devices')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async listByCourt(courtId: string): Promise<CaptureDevice[]> {
    const { data, error } = await getSupabase()
      .from('capture_devices')
      .select('*')
      .eq('court_id', courtId)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  },

  async update(id: string, updates: CaptureDeviceUpdate): Promise<CaptureDevice> {
    const { data, error } = await getSupabase()
      .from('capture_devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ---------------------------------------------------------------------------
  // Pareamento (modo captura). Alterna entre mock e Supabase.
  // ---------------------------------------------------------------------------

  async getByPairingToken(
    pairingToken: string,
    installationId: string,
  ): Promise<CaptureDevicePairingInfo | null> {
    if (!isSupabaseConfigured()) {
      const found = mockArenaStore.findDeviceByPairingToken(pairingToken)
      if (!found) return null
      return toPairingInfo(found.device, found.court.name, found.arena.name, installationId)
    }

    const { data, error } = await getSupabase().rpc('get_capture_device_by_token', {
      p_token: pairingToken,
      p_installation_id: installationId,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      position: row.position,
      courtName: row.court_name,
      arenaName: row.arena_name,
      paired: row.paired,
      isMine: row.is_mine,
    }
  },

  async getByDeviceId(
    deviceId: string,
    installationId: string,
  ): Promise<CaptureDevicePairingInfo | null> {
    if (!isSupabaseConfigured()) {
      const found = mockArenaStore.getDeviceById(deviceId)
      if (!found) return null
      return toPairingInfo(found.device, found.court.name, found.arena.name, installationId)
    }

    const { data, error } = await getSupabase().rpc('get_capture_device_by_id', {
      p_device_id: deviceId,
      p_installation_id: installationId,
    })
    if (error) throw error
    const row = data?.[0]
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      position: row.position,
      courtName: row.court_name,
      arenaName: row.arena_name,
      paired: row.paired,
      isMine: row.is_mine,
    }
  },

  async pairDevice(pairingToken: string, installationId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.pairDevice(pairingToken, installationId)
    }

    const { data, error } = await getSupabase().rpc('pair_capture_device', {
      p_token: pairingToken,
      p_installation_id: installationId,
    })
    if (error) throw error
    return Boolean(data)
  },

  async sendHeartbeat(deviceId: string, installationId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.sendHeartbeat(deviceId, installationId)
    }

    const { data, error } = await getSupabase().rpc('send_capture_device_heartbeat', {
      p_device_id: deviceId,
      p_installation_id: installationId,
    })
    if (error) throw error
    return Boolean(data)
  },

  /** Muda o status do dispositivo (ready/recording/uploading/error) pelo celular pareado. */
  async setStatus(
    deviceId: string,
    installationId: string,
    status: CaptureDevice['status'],
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.setDeviceStatus(deviceId, installationId, status)
    }

    const { data, error } = await getSupabase().rpc('set_capture_device_status', {
      p_device_id: deviceId,
      p_installation_id: installationId,
      p_status: status,
    })
    if (error) throw error
    return Boolean(data)
  },

  async unpairDevice(deviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return mockArenaStore.unpairDevice(deviceId)
    }

    const { error } = await getSupabase()
      .from('capture_devices')
      .update({
        paired: false,
        capture_installation_id: null,
        status: 'offline',
        last_seen: null,
        session_id: null,
      })
      .eq('id', deviceId)
    if (error) throw error
    return true
  },

  async getDeviceStatus(deviceId: string): Promise<{
    presence: 'online' | 'offline'
    lastSeen: string | null
  }> {
    const device = isSupabaseConfigured()
      ? await this.get(deviceId)
      : (mockArenaStore.getDeviceById(deviceId)?.device ?? null)
    return {
      presence: deriveCapturePresence(device?.last_seen),
      lastSeen: device?.last_seen ?? null,
    }
  },
}
