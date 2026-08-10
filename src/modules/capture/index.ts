export { CaptureHeader } from './components/capture-header'
export { CaptureRecorder } from './components/capture-recorder'

export {
  useCaptureDevice,
  useCaptureDeviceById,
  captureDeviceKeys,
} from './hooks/use-capture-device'
export { usePairCaptureDevice } from './hooks/use-capture-pairing'
export { useCaptureHeartbeat } from './hooks/use-capture-heartbeat'
export { useActiveCaptureSession } from './hooks/use-active-session'

export { CapturePairingPage } from './pages/capture-pairing-page'
export { CaptureDevicePage } from './pages/capture-device-page'

export { getOrCreateCaptureInstallationId } from './utils/capture-installation'
