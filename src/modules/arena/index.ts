export { arenaNavigation } from './components/arena-nav'
export { ArenaLayout } from './components/arena-layout'
export { ArenaHeader } from './components/arena-header'
export { ArenaAccessGuard } from './components/arena-access-guard'
export {
  CaptureDeviceStatusBadge,
  CourtStatusBadge,
  DeviceStatusDot,
  SessionStatusBadge,
} from './components/arena-status-badge'
export { CaptureDeviceStatus as CaptureDeviceStatusListItem } from './components/capture-device-status'
export { CourtCard } from './components/court-card'
export { CaptureDeviceCard } from './components/capture-device-card'
export { SessionCard } from './components/session-card'
export { SessionOverview } from './components/session-overview'
export { NewArenaWizard } from './components/new-arena-wizard'

export { useCurrentArena, arenaDashboardKeys } from './hooks/use-arena'
export { useArenaDashboard } from './hooks/use-arena-dashboard'
export { useCourts } from './hooks/use-courts'
export { useCaptureDevices } from './hooks/use-capture-devices'
export { useSessions, useSession } from './hooks/use-sessions'
export { useCreateArena } from './hooks/use-create-arena'
export { useUnpairDevice } from './hooks/use-unpair-device'

export { arenaDashboardService } from './services/arena-dashboard.service'
export { mockArenaStore, buildQrCode } from './services/mock-arena-dashboard'

export type {
  ArenaDashboardSummary,
  ArenaMatchSummary,
  CaptureDeviceStatus,
  CaptureDeviceView,
  CourtStatus,
  CourtView,
  NewArenaInput,
  SessionDetail,
  SessionStatus,
  SessionView,
} from './types/arena-dashboard.types'
export {
  CAPTURE_DEVICE_STATUS_LABELS,
  COURT_STATUS_LABELS,
  SESSION_STATUS_LABELS,
} from './types/arena-dashboard.types'
