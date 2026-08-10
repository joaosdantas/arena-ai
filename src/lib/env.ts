import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL deve ser uma URL válida')
    .or(z.literal(''))
    .default(''),
  VITE_SUPABASE_ANON_KEY: z.string().default(''),
  VITE_APP_NAME: z.string().default('Arena AI'),
  VITE_API_MOCK: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables. Check your .env file.')
}

export const env = parsed.data
