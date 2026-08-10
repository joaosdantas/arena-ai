import { useEffect, useRef, useState } from 'react'

import { Maximize, Minimize, Pause, Play, RefreshCw, Volume2, VolumeX } from 'lucide-react'

import { cn } from '@/lib/utils'

import { formatDuration } from '@/utils/format'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loadError, setLoadError] = useState(false)
  const [lastSrc, setLastSrc] = useState(src)

  if (src !== lastSrc) {
    setLastSrc(src)
    setLoadError(false)
  }

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function handlePlaybackError() {
    setLoadError(true)
    setIsPlaying(false)
  }

  function retry() {
    setLoadError(false)
    const video = videoRef.current
    if (video) {
      video.load()
    }
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  function toggleFullscreen() {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void container.requestFullscreen()
    }
  }

  function handleSeek(value: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value
    setCurrentTime(value)
  }

  function handleVolumeChange(value: number) {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    video.muted = value === 0
    setVolume(value)
    setMuted(value === 0)
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    setVolume(video.muted ? 0 : video.volume)
  }

  return (
    <div ref={containerRef} className={cn('bg-black overflow-hidden rounded-xl border', className)}>
      {loadError ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border bg-muted px-6 text-center">
          <p className="text-sm font-medium text-foreground">
            Não foi possível reproduzir o vídeo.
          </p>
          <p className="text-muted-foreground text-xs">
            O link pode ter expirado ou o arquivo pode estar indisponível no momento.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium"
          >
            <RefreshCw className="size-3.5" />
            Tentar novamente
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="aspect-video w-full"
          playsInline
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handlePlaybackError}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        />
      )}

      {!loadError ? (
        <div className="bg-black/90 flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            className="text-white hover:text-white/80"
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>

          <span className="text-white/80 text-xs tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(Number(event.target.value))}
            aria-label="Posição do vídeo"
            className="flex-1 accent-white"
          />

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
            className="text-white hover:text-white/80"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            aria-label="Volume"
            className="w-16 accent-white sm:w-24"
          />

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="text-white hover:text-white/80"
          >
            {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      ) : null}
    </div>
  )
}
