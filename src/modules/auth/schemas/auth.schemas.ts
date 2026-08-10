import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Informe seu nome completo').max(120),
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const recoverPasswordSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RecoverPasswordInput = z.infer<typeof recoverPasswordSchema>
