import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { ArenaSelect } from '@/modules/matches/components/arena-select'
import { type MatchFormInput, matchFormSchema } from '@/modules/matches/schemas/match.schema'
import { SPORT_OPTIONS } from '@/modules/matches/types/match.types'

interface MatchFormProps {
  defaultValues?: Partial<MatchFormInput>
  submitLabel: string
  isSubmitting: boolean
  onSubmit: (values: MatchFormInput) => void
  onCancel: () => void
}

export function MatchForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: MatchFormProps) {
  const form = useForm<MatchFormInput>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      title: '',
      sport: 'football',
      arenaId: '',
      description: '',
      scheduledDate: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Semifinal — Furacão FC vs. Atlético Real" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e hora</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="arenaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arena</FormLabel>
              <FormControl>
                <ArenaSelect value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormDescription>Local onde a partida será disputada.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre a partida (opcional)."
                  {...field}
                />
              </FormControl>
              <FormDescription>Aparecerá na página de detalhes da partida.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
