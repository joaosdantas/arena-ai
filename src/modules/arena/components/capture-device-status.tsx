import { useEffect, useState } from 'react'

import {
  CaptureDeviceStatusBadge,
  DeviceStatusDot,
} from '@/modules/arena/components/arena-status-badge'
import type { CaptureDeviceView } from '@/modules/arena/types/arena-dashboard.types'

import { formatTimeAgo } from '@/utils/format'

export function CaptureDeviceStatus({ device }: { device: CaptureDeviceView }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 15_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <DeviceStatusDot status={device.status} presence={device.presence} />
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{device.name}</p>
          <p className="text-muted-foreground text-xs">
            Última conexão: {formatTimeAgo(device.lastSeen)}
          </p>
        </div>
      </div>
      <CaptureDeviceStatusBadge status={device.status} presence={device.presence} />
    </div>
  )
}
