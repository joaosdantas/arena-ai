import { useForm } from 'react-hook-form'

import { useMutation } from '@tanstack/react-query'

import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useAuth } from '@/contexts/AuthContext'

import { AuthForm } from '@/modules/auth/components/auth-form'
import { type RegisterInput, registerSchema } from '@/modules/auth/schemas/auth.schemas'
import { authService } from '@/modules/auth/services/auth.service'

import { appPaths } from '@/routes/paths'

export function RegisterPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const user = await authService.signUp(values.email, values.password, {
        fullName: values.fullName,
        redirectTo: `${window.location.origin}${appPaths.dashboard}`,
      })
      if (user) {
        await authService.createUserProfile(user, values.fullName)
        await signIn(values.email, values.password)
      }
      return user
    },
    onSuccess: (user) => {
      if (user) {
        toast.success('Conta criada com sucesso! Bem-vindo ao Arena AI.')
      } else {
        toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
        navigate(appPaths.login)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function handleSubmit(values: RegisterInput) {
    registerMutation.mutate(values)
  }

  return (
    <AuthForm
      title="Criar conta"
      description="Cadastre-se para começar a gerenciar suas partidas."
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to={appPaths.login} className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2 w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Criar conta
          </Button>
        </form>
      </Form>
    </AuthForm>
  )
}
