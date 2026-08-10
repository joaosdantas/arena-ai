import { useForm } from 'react-hook-form'

import { useMutation } from '@tanstack/react-query'

import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'

import { Link } from 'react-router-dom'

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
import { type LoginInput, loginSchema } from '@/modules/auth/schemas/auth.schemas'

import { appPaths } from '@/routes/paths'

export function LoginPage() {
  const { signIn } = useAuth()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginInput) => signIn(values.email, values.password),
    onSuccess: () => {
      toast.success('Bem-vindo de volta!')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function handleSubmit(values: LoginInput) {
    loginMutation.mutate(values)
  }

  return (
    <AuthForm
      title="Entrar"
      description="Acesse sua conta para gerenciar suas partidas."
      footer={
        <>
          Não tem uma conta?{' '}
          <Link to={appPaths.register} className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4" noValidate>
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
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Link
              to={appPaths.recover}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LockKeyhole className="size-4" />
            )}
            Entrar
          </Button>
        </form>
      </Form>
    </AuthForm>
  )
}
