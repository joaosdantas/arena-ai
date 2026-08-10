import { useEffect, useRef, useState } from 'react'

import { Camera, CameraOff, CheckCircle2, Circle, Loader2, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
  useCaptureRecording,
  type CaptureRecordingResult,
} from '@/modules/capture/hooks/use-capture-recording'
import type { ActiveCaptureSession } from '@/services/capture-video.service'
import { captureDeviceService } from '@/services/capture-device.service'
import { captureVideoService } from '@/services/capture-video.service'
import { isSupabaseConfigured } from '@/services/supabase'

import {
  formatElapsed,
  generateVideoThumbnail,
  getFileExtensionFromMime,
  isMediaRecorderSupported,
} from '@/modules/capture/utils/media-recorder'

import { toErrorMessage } from '@/utils/errors'
import { createLogger } from '@/utils/log'
import { cn } from '@/lib/utils'

const log = createLogger('CaptureDevice')

interface CaptureRecorderProps {
  deviceId: string
  installationId: string
  activeSession: ActiveCaptureSession | null | undefined
  onUploaded?: () => void
}

type RecorderPhase = 'idle' | 'recording' | 'uploading' | 'done'

export function CaptureRecorder({
  deviceId,
  installationId,
  activeSession,
  onUploaded,
}: CaptureRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<RecorderPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { recording, elapsed, start, stop } = useCaptureRecording({
    onComplete: (result) => void handleRecordingComplete(result),
    onError: (message) => setError(message),
  })

  const canRecord = activeSession?.status === 'active' || activeSession?.status === 'processing'

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setOpen(true)
      setError(null)
      await captureDeviceService.setStatus(deviceId, installationId, 'ready')
    } catch {
      setError('Não foi possível acessar a câmera deste dispositivo.')
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setOpen(false)
    setPhase('idle')
    setError(null)
  }

  function startRecording() {
    if (!streamRef.current || !canRecord) return
    setError(null)
    log.info('iniciando gravação', { deviceId, sessionId: activeSession?.sessionId })
    void captureDeviceService.setStatus(deviceId, installationId, 'recording')
    start(streamRef.current)
    setPhase('recording')
  }

  function stopRecording() {
    if (!recording) return
    log.info('parando gravação', { deviceId })
    void stop()
  }

  async function handleRecordingComplete(result: CaptureRecordingResult) {
    if (!activeSession) return
    setPhase('uploading')
    setUploadProgress(0)
    let videoId: string | null = null
    try {
      await captureDeviceService.setStatus(deviceId, installationId, 'uploading')

      const created = await captureVideoService.createVideo({
        deviceId,
        installationId,
        sessionId: activeSession.sessionId,
        mimeType: result.mimeType,
        fileSize: result.blob.size,
        duration: result.durationSec,
      })
      videoId = created.videoId

      const extension = getFileExtensionFromMime(result.mimeType)
      const file = new File([result.blob], `${created.videoId}.${extension}`, {
        type: result.mimeType,
      })

      let thumbnailUrl: string | null = null
      if (!isSupabaseConfigured()) {
        try {
          thumbnailUrl = await generateVideoThumbnail(result.blob)
        } catch {
          thumbnailUrl = null
        }
      }

      log.info('upload iniciado', { videoId, bytes: result.blob.size, mimeType: result.mimeType })
      await captureVideoService.uploadCapturedVideo(file, created.storagePath, {
        onProgress: setUploadProgress,
        thumbnailUrl,
      })
      log.info('upload concluído', { videoId })

      await captureVideoService.updateVideoStatus(videoId, installationId, 'pending')

      await captureDeviceService.setStatus(deviceId, installationId, 'ready')

      setPhase('done')
      onUploaded?.()
    } catch (uploadError) {
      log.error('falha no envio da gravação', uploadError)
      if (videoId) {
        try {
          await captureVideoService.updateVideoStatus(videoId, installationId, 'failed')
          log.warn('gravação marcada como failed', { videoId })
        } catch {
          log.error('não foi possível marcar a gravação como failed', videoId)
        }
      }
      setError(
        toErrorMessage(
          uploadError,
          'Não conseguimos enviar este vídeo. Verifique sua conexão e tente novamente.',
        ),
      )
      setPhase('idle')
      await captureDeviceService.setStatus(deviceId, installationId, 'error').catch(() => undefined)
    }
  }

  if (!open) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        {!isMediaRecorderSupported() ? (
          <p className="text-destructive text-sm">
            Este navegador não suporta gravação de vídeo. Use um navegador recente (Chrome,
            Edge ou Safari).
          </p>
        ) : (
          <Button size="lg" className="w-full" onClick={() => void openCamera()}>
            <Camera className="size-5" />
            Abrir câmera
          </Button>
        )}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full overflow-hidden rounded-2xl border bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          autoPlay
          playsInline
          muted
        />
      </div>

      {activeSession ? (
        <div className="w-full rounded-lg border px-3 py-2 text-sm">
          <p className="font-medium">{activeSession.courtName}</p>
          <p className="text-muted-foreground text-xs">
            {activeSession.arenaName} ·{' '}
            {activeSession.status === 'active' ? 'Sessão ativa' : `Sessão ${activeSession.status}`}
          </p>
        </div>
      ) : null}

      {phase === 'recording' || recording ? (
        <div className="flex w-full items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2">
            <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-sm tabular-nums">{formatElapsed(elapsed)}</span>
          </div>
          <Button variant="destructive" size="lg" onClick={stopRecording}>
            <Square className="size-4" />
            Parar
          </Button>
        </div>
      ) : null}

      {phase === 'uploading' ? (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Enviando gravação... {uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {phase === 'done' ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          <CheckCircle2 className="size-4" />
          Gravação enviada e em processamento.
        </div>
      ) : null}

      {!recording && phase !== 'uploading' ? (
        <Button
          variant={canRecord ? 'default' : 'outline'}
          size="lg"
          className={cn('w-full', canRecord && 'bg-red-600 hover:bg-red-700')}
          disabled={!canRecord}
          onClick={canRecord ? startRecording : undefined}
        >
          <Circle className="size-5" />
          {canRecord ? 'Gravar' : 'Aguardando sessão ativa'}
        </Button>
      ) : null}

      <Button variant="outline" size="lg" className="w-full" onClick={closeCamera}>
        <CameraOff className="size-5" />
        Parar câmera
      </Button>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
