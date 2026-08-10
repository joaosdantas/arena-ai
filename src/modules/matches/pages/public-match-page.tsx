import { useQuery } from '@tanstack/react-query'

import { CalendarDays, Copy, MapPin, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { ErrorState } from '@/components/common/error-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { MatchStatusBadge } from '@/modules/matches/components/match-status-badge'
import { SportIcon } from '@/modules/matches/components/sport-icon'
import { matchService } from '@/modules/matches/services/match.service'
import { type Match, SPORT_LABELS } from '@/modules/matches/types/match.types'
import { VideoPlayer } from '@/modules/videos/components/video-player'
import { VideoStatusBadge } from '@/modules/videos/components/video-status-badge'
import { videoService } from '@/modules/videos/services/video.service'

import { formatDateTime } from '@/utils/format'
import { copyMatchLink, whatsappShare } from '@/utils/share'

function PublicMatchSkeleton() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  )
}

export function PublicMatchPage() {
  const { id } = useParams<{ id: string }>()

  const matchQuery = useQuery({
    queryKey: ['public-match', id],
    queryFn: () => matchService.getMatchById(id ?? ''),
    enabled: Boolean(id),
  })

  const match: Match | null | undefined = matchQuery.data

  const videoQuery = useQuery({
    queryKey: ['public-match-video', id],
    queryFn: async () => {
      try {
        return await videoService.getVideoByMatch(id ?? '')
      } catch {
        return null
      }
    },
    enabled: Boolean(id && match?.id),
  })

  function handleCopyLink() {
    if (!match) return
    void copyMatchLink(match.id)
      .then(() => toast.success('Link copiado!'))
      .catch(() => toast.error('Não foi possível copiar o link.'))
  }

  function handleWhatsApp() {
    if (!match) return
    whatsappShare(match)
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center px-4 py-6">
      <a href="/" aria-label="Arena AI">
        <BrandLogo />
      </a>

      <main className="mt-6 flex w-full max-w-2xl flex-col gap-4">
        {matchQuery.isLoading ? <PublicMatchSkeleton /> : null}

        {matchQuery.isError ? <ErrorState message="Não foi possível carregar a partida." /> : null}

        {!matchQuery.isLoading && !matchQuery.isError && !match ? (
          <ErrorState message="Partida não encontrada ou ainda não disponível publicamente." />
        ) : null}

        {match ? (
          <>
            <section className="from-slate-900 via-slate-950 to-black relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-6 -bottom-8 opacity-15">
                <SportIcon sport={match.sport} className="size-44" />
              </div>
              <div className="relative z-10 flex flex-col gap-3">
                <MatchStatusBadge status={match.status} />
                <h1 className="text-2xl font-bold sm:text-3xl">{match.title}</h1>
                <p className="text-white/80 text-sm">{SPORT_LABELS[match.sport]}</p>
                <div className="text-white/85 mt-1 flex flex-col gap-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {match.arena?.name ?? 'Arena não definida'}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {formatDateTime(match.scheduledAt)}
                  </span>
                </div>
              </div>
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gravação</CardTitle>
                <CardDescription>Assista a partida diretamente por este link.</CardDescription>
              </CardHeader>
              <CardContent>
                {videoQuery.isLoading ? (
                  <Skeleton className="aspect-video w-full rounded-xl" />
                ) : null}

                {!videoQuery.isLoading && videoQuery.data ? (
                  <div className="flex flex-col gap-3">
                    {videoQuery.data.url ? <VideoPlayer src={videoQuery.data.url} /> : null}
                    <VideoStatusBadge status={videoQuery.data.status} />
                  </div>
                ) : null}

                {!videoQuery.isLoading && !videoQuery.data ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    A gravação desta partida ainda não está disponível publicamente.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="flex-1 bg-[#25D366] text-white hover:bg-[#1eb856]"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="size-5" />
                Compartilhar no WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={handleCopyLink}>
                <Copy className="size-5" />
                Copiar link
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
