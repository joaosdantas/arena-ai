import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

import {
  CAPTURE_DEVICE_STATUS_LABELS,
  COURT_STATUS_LABELS,
  SESSION_STATUS_LABELS,
} from '@/modules/arena/types/arena-dashboard.types'
import type {
  CaptureDeviceStatus,
  CourtStatus,
  SessionStatus,
} from '@/modules/arena/types/arena-dashboard.types'

import type { CapturePresence } from '@/types/domain'

const SESSION_STATUS_VARIANT: Record<SessionStatus, 'default' | 'secondary' | 'outline'> = {
  scheduled: 'secondary',
  active: 'default',
  finished: 'outline',
  processing: 'outline',
  failed: 'secondary',
}

export function devicePresenceLabel(
  status: CaptureDeviceStatus,
  presence: CapturePresence,
): string {
  if (status === 'recording') return CAPTURE_DEVICE_STATUS_LABELS.recording
  if (status === 'uploading') return CAPTURE_DEVICE_STATUS_LABELS.uploading
  if (status === 'error') return CAPTURE_DEVICE_STATUS_LABELS.error
  return presence === 'online' ? 'Online' : 'Offline'
}

export function DeviceStatusDot({
  status,
  presence,
}: {
  status: CaptureDeviceStatus
  presence: CapturePresence
}) {
  if (status === 'recording') {
    return <span className="bg-amber-500 inline-block size-2 shrink-0 rounded-full" />
  }
  if (status === 'uploading') {
    return <span className="bg-sky-500 inline-block size-2 shrink-0 rounded-full" />
  }
  if (status === 'error') {
    return <span className="bg-orange-500 inline-block size-2 shrink-0 rounded-full" />
  }
  return (
    <span
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        presence === 'online' ? 'bg-emerald-500' : 'bg-red-500',
      )}
    />
  )
}

export function CaptureDeviceStatusBadge({
  status,
  presence,
}: {
  status: CaptureDeviceStatus
  presence: CapturePresence
}) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <DeviceStatusDot status={status} presence={presence} />
      {devicePresenceLabel(status, presence)}
    </Badge>
  )
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return <Badge variant={SESSION_STATUS_VARIANT[status]}>{SESSION_STATUS_LABELS[status]}</Badge>
}

export function CourtStatusBadge({ status }: { status: CourtStatus }) {
  if (status === 'inactive') {
    return <Badge variant="secondary">{COURT_STATUS_LABELS.inactive}</Badge>
  }
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="bg-emerald-500 inline-block size-2 rounded-full" />
      {COURT_STATUS_LABELS.active}
    </Badge>
  )
}
