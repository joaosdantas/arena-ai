import { useRef, useState } from 'react'

import { CheckCircle2, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { validateVideoFile } from '@/modules/videos/utils/video.validation'

import type { ActiveCaptureSession } from '@/services/capture-video.service'
import { captureVideoService } from '@/services/capture-video.service'

import { toErrorMessage } from '@/utils/errors'
import { createLogger } from '@/utils/log'

const log = createLogger('CaptureVideoUpload')

interface CaptureVideoUploaderProps {
  deviceId: string
  installationId: string
  activeSession: ActiveCaptureSession | null | undefined
  onUploaded?: () => void
}

export function CaptureVideoUploader({
  deviceId,
  installationId,
  activeSession,
  onUploaded,
}: CaptureVideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadFile(file: File) {
    setError(null)
    setUploaded(false)
    const validationError = validateVideoFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    if (!activeSession || !['active', 'processing'].includes(activeSession.status)) {
      setError('A sala precisa estar aberta para receber vídeos.')
      return
    }

    setUploading(true)
    setProgress(0)
    let videoId: string | null = null
    try {
      const mimeType =
        file.type ||
        (file.name.toLowerCase().endsWith('.mov')
          ? 'video/quicktime'
          : file.name.toLowerCase().endsWith('.webm')
            ? 'video/webm'
            : 'video/mp4')
      const created = await captureVideoService.createVideo({
        deviceId,
        installationId,
        sessionId: activeSession.sessionId,
        mimeType,
        fileSize: file.size,
      })
      videoId = created.videoId
      await captureVideoService.uploadCapturedVideo(file, created.storagePath, {
        onProgress: setProgress,
      })
      const updated = await captureVideoService.updateVideoStatus(
        videoId,
        installationId,
        'pending',
      )
      if (!updated) throw new Error('Não foi possível registrar o envio do vídeo.')
      setUploaded(true)
      toast.success('Vídeo enviado para processamento.')
      onUploaded?.()
    } catch (uploadError) {
      log.error('falha no envio do vídeo', uploadError)
      if (videoId) {
        try {
          await captureVideoService.updateVideoStatus(videoId, installationId, 'failed')
        } catch (statusError) {
          log.error('não foi possível marcar o vídeo como failed', statusError)
        }
      }
      setError(toErrorMessage(uploadError, 'Não foi possível enviar o vídeo. Tente novamente.'))
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void uploadFile(file)
  }

  return (
    <div className="w-full space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="font-medium">Enviar vídeo existente</h3>
        <p className="text-muted-foreground text-sm">
          Selecione um vídeo gravado neste ou em outro dispositivo (.mp4, .mov ou .webm; até 2 GB).
        </p>
      </div>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={uploading || !activeSession}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {uploading ? 'Enviando vídeo...' : 'Selecionar vídeo'}
      </Button>
      {uploading ? <Progress value={progress} aria-label="Progresso do upload" /> : null}
      {uploaded ? (
        <p className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="size-4" />
          Vídeo enviado e aguardando processamento.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
