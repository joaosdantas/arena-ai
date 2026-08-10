import { MessageCircle, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import {
  getVideoShareText,
  getVideoShareUrl,
} from '@/modules/player/utils/player-share'

interface ShareVideoButtonProps {
  title: string
  videoId: string
  className?: string
}

export function ShareVideoButton({ title, videoId, className }: ShareVideoButtonProps) {
  const url = getVideoShareUrl(videoId)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: getVideoShareText(title), url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  return (
    <Button variant="outline" className={className} onClick={() => void handleShare()}>
      <Share2 className="size-5" />
      Compartilhar
    </Button>
  )
}

interface WhatsAppVideoButtonProps {
  title: string
  videoId: string
  className?: string
}

export function WhatsAppVideoButton({ title, videoId, className }: WhatsAppVideoButtonProps) {
  const text = `${getVideoShareText(title)}\n${getVideoShareUrl(videoId)}`

  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')}
    >
      <MessageCircle className="size-5" />
      WhatsApp
    </Button>
  )
}
