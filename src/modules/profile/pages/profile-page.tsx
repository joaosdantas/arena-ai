import { useForm } from 'react-hook-form'

import { type ChangeEvent, useRef, useState } from 'react'

import { useMutation } from '@tanstack/react-query'

import { zodResolver } from '@hookform/resolvers/zod'

import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

import {
  type UpdateProfileInput,
  updateProfileSchema,
} from '@/modules/profile/schemas/profile.schemas'
import { updateProfile, uploadAvatar } from '@/modules/profile/services/profile.service'

import { appPaths } from '@/routes/paths'

function getInitials(name?: string | null, email?: string | null): string {
  const source = name ?? email ?? '?'
  return source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '',
    },
    values: {
      fullName: profile?.fullName ?? '',
    },
  })

  const displayAvatarUrl = pendingAvatarUrl ?? profile?.avatarUrl

  const saveMutation = useMutation({
    mutationFn: (values: UpdateProfileInput) => {
      if (!user) throw new Error('Usuário não autenticado.')
      return updateProfile(user.id, {
        fullName: values.fullName,
        avatarUrl: displayAvatarUrl ?? null,
      })
    },
    onSuccess: () => {
      void refreshProfile().then(() => toast.success('Perfil atualizado com sucesso!'))
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setPendingAvatarUrl(url)
      toast.success('Foto atualizada. Clique em salvar para confirmar.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a foto.')
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  function handleSubmit(values: UpdateProfileInput) {
    saveMutation.mutate(values)
  }

  const displayName = profile?.fullName || user?.email || 'Usuário Arena'

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit text-muted-foreground"
        onClick={() => navigate(appPaths.dashboard)}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie suas informações pessoais e preferências da conta.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-16 text-lg">
            <AvatarImage src={displayAvatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName, user?.email)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full outline-none"
            aria-label="Alterar foto"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>
        </div>
        <div className="space-y-0.5">
          <p className="font-medium">{displayName}</p>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
