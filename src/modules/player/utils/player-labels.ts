import { SPORT_LABELS } from '@/modules/matches/types/match.types'

const SPORT_ALIASES: Record<string, string> = {
  football: SPORT_LABELS.football,
  basketball: SPORT_LABELS.basketball,
  volleyball: SPORT_LABELS.volleyball,
  other: SPORT_LABELS.other,
  futebol: SPORT_LABELS.football,
  basquete: SPORT_LABELS.basketball,
  volei: SPORT_LABELS.volleyball,
  vôlei: SPORT_LABELS.volleyball,
}

export function sportLabel(sport: string | null | undefined): string {
  if (!sport) return '—'
  return SPORT_ALIASES[sport.toLowerCase()] ?? sport
}
