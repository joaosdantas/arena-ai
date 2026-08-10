import type { ComponentType } from 'react'

import { CircleDot, Sparkles, Trophy, Volleyball } from 'lucide-react'

import type { SportType } from '@/modules/matches/types/match.types'

const SPORT_ICONS: Record<SportType, ComponentType<{ className?: string }>> = {
  football: Trophy,
  basketball: CircleDot,
  volleyball: Volleyball,
  other: Sparkles,
}

export function SportIcon({ sport, className }: { sport: SportType; className?: string }) {
  const Icon = SPORT_ICONS[sport]
  return <Icon className={className} />
}
