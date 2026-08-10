import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres').max(120),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
