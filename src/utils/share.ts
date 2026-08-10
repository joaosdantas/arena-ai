import type { Match } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { formatDateTime } from '@/utils/format'

export function getMatchShareUrl(matchId: string): string {
  return `${window.location.origin}${appPaths.publicMatch(matchId)}`
}

export function getMatchShareText(match: Match): string {
  const parts = [`Assista a partida ${match.title}`]
  if (match.arena?.name) parts.push(`Arena: ${match.arena.name}`)
  if (match.scheduledAt) parts.push(formatDateTime(match.scheduledAt))
  parts.push('via Arena AI')
  return parts.join(' | ')
}

export async function copyMatchLink(matchId: string): Promise<void> {
  await navigator.clipboard.writeText(getMatchShareUrl(matchId))
}

export function whatsappShare(match: Match): void {
  const text = `${getMatchShareText(match)}\n${getMatchShareUrl(match.id)}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

export async function shareMatch(match: Match): Promise<'shared' | 'copied'> {
  const url = getMatchShareUrl(match.id)

  if (navigator.share) {
    try {
      await navigator.share({ title: match.title, text: getMatchShareText(match), url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
      throw error
    }
  }

  await copyMatchLink(match.id)
  return 'copied'
}
