import { z } from 'zod'

import type { MatchFormData, SportType } from '@/modules/matches/types/match.types'

export const matchFormSchema = z.object({
  title: z
    .string()
    .min(3, 'O título deve ter pelo menos 3 caracteres')
    .max(120, 'O título deve ter no máximo 120 caracteres'),
  sport: z.enum(['football', 'basketball', 'volleyball', 'other']),
  arenaId: z.string().min(1, 'Selecione a arena'),
  description: z.string().max(500, 'A descrição deve ter no máximo 500 caracteres'),
  scheduledDate: z.string().min(1, 'Informe a data da partida'),
}) satisfies z.ZodType<MatchFormData>

export type MatchFormInput = z.infer<typeof matchFormSchema>

export function isSportType(value: string): value is SportType {
  return (
    value === 'football' || value === 'basketball' || value === 'volleyball' || value === 'other'
  )
}
