import { useRef, useState } from 'react'

import { CheckCircle2, FileVideo2, UploadCloud, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import { cn } from '@/lib/utils'

import { useVideoUpload } from '@/modules/videos/hooks/use-video-upload'
import {
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_VIDEO_SIZE_BYTES,
} from '@/modules/videos/utils/video.validation'

import { formatBytes } from '@/utils/format'

interface UploadVideoProps {
  matchId: string
}

export function UploadVideo({ matchId }: UploadVideoProps) {
  const { state, progress, error, start, cancel, reset } = useVideoUpload(matchId)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFile(file?: File | null) {
    if (!file) return
    setSelectedFile(file)
    start(file)
  }

  if (state === 'uploading' && selectedFile) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <FileVideo2 className="size-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-muted-foreground text-xs">
              Enviando... {progress.percent}% • {formatBytes(progress.loadedBytes)} de{' '}
              {formatBytes(progress.totalBytes)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={cancel}
            aria-label="Cancelar upload"
          >
            <X className="size-4" />
          </Button>
        </div>
        <Progress value={progress.percent} />
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
        <CheckCircle2 className="size-5 shrink-0" />
        Vídeo enviado com sucesso!
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors',
          isDragging ? 'border-primary bg-accent' : 'hover:bg-accent/50',
        )}
      >
        <UploadCloud className="text-muted-foreground size-8" />
        <p className="text-sm font-medium">Arraste o vídeo aqui ou</p>
        <Button type="button" size="sm">
          Selecionar vídeo
        </Button>
        <p className="text-muted-foreground text-xs">
          {ALLOWED_VIDEO_EXTENSIONS.join(' ')} • máx. {formatBytes(MAX_VIDEO_SIZE_BYTES)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>

      {state === 'error' ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Fechar
          </Button>
        </div>
      ) : null}
    </div>
  )
}
