import { useCallback, useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { matchKeys } from '@/modules/matches/hooks/use-matches'
import { playerKeys } from '@/modules/player/hooks/use-player'
import { videoKeys } from '@/modules/videos/hooks/use-videos'
import { videoService } from '@/modules/videos/services/video.service'
import type { UploadProgress } from '@/modules/videos/types/video.types'

import { toErrorMessage } from '@/utils/errors'
import { createLogger } from '@/utils/log'

const log = createLogger('VideoUpload')

export type VideoUploadState = 'idle' | 'uploading' | 'success' | 'error'

export function useVideoUpload(matchId: string) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<VideoUploadState>('idle')
  const [progress, setProgress] = useState<UploadProgress>({
    percent: 0,
    loadedBytes: 0,
    totalBytes: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setState('idle')
    setProgress({ percent: 0, loadedBytes: 0, totalBytes: 0 })
    setError(null)
  }, [])

  const start = useCallback(
    (file: File) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setState('uploading')
      setProgress({ percent: 0, loadedBytes: 0, totalBytes: file.size })
      setError(null)

      void videoService
        .uploadVideo(
          { file, matchId },
          {
            onProgress: setProgress,
            signal: controller.signal,
          },
        )
        .then(() => {
          log.info('upload concluído', { matchId, fileName: file.name })
          setState('success')
          void queryClient.invalidateQueries({ queryKey: videoKeys.byMatch(matchId) })
          void queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) })
          void queryClient.invalidateQueries({ queryKey: playerKeys.matches() })
          void queryClient.invalidateQueries({ queryKey: playerKeys.match(matchId) })
          void queryClient.invalidateQueries({ queryKey: playerKeys.matchVideos(matchId) })
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') {
            setState('idle')
            setProgress({ percent: 0, loadedBytes: 0, totalBytes: file.size })
            return
          }
          log.error('falha no upload', err)
          setState('error')
          setError(toErrorMessage(err, 'Não foi possível enviar o vídeo.'))
        })
    },
    [matchId, queryClient],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  return { state, progress, error, start, cancel, reset }
}
