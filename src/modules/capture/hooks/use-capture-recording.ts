import { useCallback, useEffect, useRef, useState } from 'react'

import { getSupportedMimeType } from '@/modules/capture/utils/media-recorder'

export interface CaptureRecordingResult {
  blob: Blob
  mimeType: string
  durationSec: number
}

interface UseCaptureRecordingOptions {
  onComplete?: (result: CaptureRecordingResult) => void
  onError?: (message: string) => void
}

/**
 * Gerencia o MediaRecorder sobre um MediaStream. O stream é de posse do
 * chamador (componente), que o obtém com getUserMedia e o encerra ao desmontar.
 */
export function useCaptureRecording(options: UseCaptureRecordingOptions = {}) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const onComplete = options.onComplete
  const onError = options.onError

  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onComplete, onError])

  const stop = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    const durationSec = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
    const mimeType = recorder.mimeType || 'video/webm'

    const stopped = new Promise<Blob>((resolve) => {
      recorder.addEventListener(
        'stop',
        () => resolve(new Blob(chunksRef.current, { type: mimeType })),
        { once: true },
      )
    })
    recorder.stop()
    const blob = await stopped

    setRecording(false)
    onCompleteRef.current?.({ blob, mimeType, durationSec })
  }, [])

  const start = useCallback(
    (stream: MediaStream) => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') return

      chunksRef.current = []
      const mimeType = getSupportedMimeType()
      try {
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data)
        }
        recorder.onerror = () => {
          setRecording(false)
          recorderRef.current = null
          onErrorRef.current?.('Falha durante a gravação. Tente novamente.')
        }
        recorder.start()
        recorderRef.current = recorder
        startedAtRef.current = Date.now()
        setElapsed(0)
        setRecording(true)
      } catch {
        onErrorRef.current?.('Este navegador não suporta gravação de vídeo.')
      }
    },
    [],
  )

  useEffect(() => {
    if (!recording) return
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(interval)
  }, [recording])

  useEffect(() => {
    function handlePageHide() {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') return
      void stop()
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      recorderRef.current = null
    }
  }, [stop])

  return { recording, elapsed, start, stop }
}
