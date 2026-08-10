import { useForm } from 'react-hook-form'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'

import { CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, MapPin, Save } from 'lucide-react'

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

import { cn } from '@/lib/utils'

import { ArenaSelect } from '@/modules/matches/components/arena-select'
import { useArenas } from '@/modules/matches/hooks/use-arenas'
import { type MatchFormInput, matchFormSchema } from '@/modules/matches/schemas/match.schema'
import { SPORT_LABELS, SPORT_OPTIONS } from '@/modules/matches/types/match.types'

import { formatDateTime } from '@/utils/format'

interface CreateMatchWizardProps {
  isSubmitting: boolean
  onSubmit: (values: MatchFormInput) => void
}

const STEPS = ['Informações', 'Confirmação']

export function CreateMatchWizard({ isSubmitting, onSubmit }: CreateMatchWizardProps) {
  const [step, setStep] = useState(1)
  const [summary, setSummary] = useState<MatchFormInput | null>(null)
  const { data: arenas } = useArenas()

  const form = useForm<MatchFormInput>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      title: '',
      sport: 'football',
      arenaId: '',
      description: '',
      scheduledDate: '',
    },
  })

  const selectedArena = arenas?.find((arena) => arena.id === summary?.arenaId)

  function handleContinue() {
    void form.handleSubmit((values) => {
      setSummary(values)
      setStep(2)
    })()
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1
          const isActive = step === stepNumber
          const isDone = step > stepNumber
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                  isActive || isDone
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-3.5" /> : stepNumber}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
              {stepNumber < STEPS.length ? <div className="bg-border mx-1 h-px w-6" /> : null}
            </li>
          )
        })}
      </ol>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da partida</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: Semifinal — Furacão FC vs. Atlético Real"
                        {...field}
                      />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="button" size="lg" onClick={handleContinue}>
                  Continuar
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 && summary ? (
            <div className="flex flex-col gap-6">
              <div className="from-primary via-emerald-700 to-emerald-900 rounded-xl bg-gradient-to-br p-5 text-white">
                <p className="text-brand text-xs font-bold tracking-widest uppercase">Resumo</p>
                <h2 className="mt-1 text-xl font-bold">{summary.title}</h2>
                <p className="mt-1 text-sm text-white/85">{SPORT_LABELS[summary.sport]}</p>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-white/85">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {selectedArena?.name ?? 'Arena não definida'}
                  </span>
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4" />
                    {summary.scheduledDate ? formatDateTime(summary.scheduledDate) : '—'}
                  </span>
                </div>
                {summary.description ? (
                  <p className="mt-3 border-t border-white/20 pt-3 text-sm text-white/75">
                    {summary.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Criar partida
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  )
}
