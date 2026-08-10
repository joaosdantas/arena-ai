import { useForm } from 'react-hook-form'

import { useMutation } from '@tanstack/react-query'

import { zodResolver } from '@hookform/resolvers/zod'

import { KeyRound, Loader2 } from 'lucide-react'
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

import { AuthForm } from '@/modules/auth/components/auth-form'
import {
  type RecoverPasswordInput,
  recoverPasswordSchema,
} from '@/modules/auth/schemas/auth.schemas'
import { authService } from '@/modules/auth/services/auth.service'

import { appPaths } from '@/routes/paths'

export function RecoverPasswordPage() {
  const form = useForm<RecoverPasswordInput>({
    resolver: zodResolver(recoverPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const recoverMutation = useMutation({
    mutationFn: (values: RecoverPasswordInput) => authService.resetPassword(values.email),
    onSuccess: () => {
      toast.success('Enviamos um link de recuperação para o seu e-mail.')
      form.reset()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function handleSubmit(values: RecoverPasswordInput) {
    recoverMutation.mutate(values)
  }

  return (
    <AuthForm
      title="Recuperar senha"
      description="Informe seu e-mail e enviaremos um link para redefinir sua senha."
      footer={
        <>
          Lembrou a senha?{' '}
          <Link to={appPaths.login} className="text-primary font-medium hover:underline">
            Voltar para o login
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

          <Button type="submit" className="mt-2 w-full" disabled={recoverMutation.isPending}>
            {recoverMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Enviar link de recuperação
          </Button>
        </form>
      </Form>
    </AuthForm>
  )
}
