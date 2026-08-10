import { useState } from 'react'

import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import {
  Building2,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Loader2,
  PartyPopper,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { toast } from 'sonner'

import { z } from 'zod'

import { Card, CardContent } from '@/components/ui/card'
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

import { cn } from '@/lib/utils'

import { useCreateArena } from '@/modules/arena/hooks/use-create-arena'

import { appPaths } from '@/routes/paths'

const newArenaSchema = z.object({
  arenaName: z.string().min(3, 'Informe o nome da arena (mín. 3 caracteres)'),
  slug: z
    .string()
    .min(2, 'Informe o identificador público')
    .max(32, 'Máximo de 32 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use letras minúsculas, números e hífens'),
  address: z.string(),
  city: z.string(),
  state: z
    .string()
    .max(2, 'Máximo de 2 letras')
    .regex(/^$|^[A-Za-z]{2}$/, 'Informe a sigla (ex.: SP)'),
  courtName: z.string().min(2, 'Informe o nome da quadra'),
  courtSport: z.string().min(1, 'Selecione a modalidade'),
  deviceName: z.string().min(2, 'Informe o nome do dispositivo'),
  devicePosition: z.string().min(1, 'Selecione a posição da câmera'),
})

type NewArenaValues = z.infer<typeof newArenaSchema>

const DEFAULT_VALUES: NewArenaValues = {
  arenaName: '',
  slug: '',
  address: '',
  city: '',
  state: '',
  courtName: '',
  courtSport: 'Futebol',
  deviceName: '',
  devicePosition: 'lateral direita',
}

const SPORTS = ['Futebol', 'Basquete', 'Vôlei', 'Futsal', 'Outro']

const POSITIONS = ['lateral esquerda', 'lateral direita', 'fundo', 'outro']

interface WizardStep {
  label: string
  icon: typeof Building2
  fields: (keyof NewArenaValues)[]
}

const STEPS: WizardStep[] = [
  {
    label: 'Dados da arena',
    icon: Building2,
    fields: ['arenaName', 'slug', 'address', 'city', 'state'],
  },
  {
    label: 'Primeira quadra',
    icon: LayoutGrid,
    fields: ['courtName', 'courtSport'],
  },
  {
    label: 'Dispositivo',
    icon: Camera,
    fields: ['deviceName', 'devicePosition'],
  },
  {
    label: 'Finalizar',
    icon: PartyPopper,
    fields: [],
  },
]

function getDefaultSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32)
}

export function NewArenaWizard() {
  const navigate = useNavigate()
  const createArena = useCreateArena()
  const [step, setStep] = useState(0)

  const form = useForm<NewArenaValues>({
    resolver: zodResolver(newArenaSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  })

  const currentStep = STEPS[step]

  async function handleNext() {
    const valid = await form.trigger(currentStep.fields)
    if (!valid) return
    setStep((value) => Math.min(value + 1, STEPS.length - 1))
  }

  function handleBack() {
    setStep((value) => Math.max(value - 1, 0))
  }

  function handleSubmit(valuesToCreate: NewArenaValues) {
    createArena.mutate(valuesToCreate, {
      onSuccess: () => {
        toast.success('Arena criada com sucesso!')
        navigate(appPaths.arena)
      },
      onError: () => {
        toast.error('Não foi possível criar a arena. Tente novamente.')
      },
    })
  }

  function fillSlugIfEmpty() {
    const slug = form.getValues('slug')
    if (slug) return
    const name = form.getValues('arenaName')
    const generated = getDefaultSlug(name)
    if (generated) form.setValue('slug', generated, { shouldValidate: true })
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((stepItem, index) => {
          const isDone = index < step
          const isCurrent = index === step
          return (
            <li key={stepItem.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                    isDone && 'bg-primary text-primary-foreground border-primary',
                    isCurrent && 'border-primary text-primary',
                  )}
                >
                  {isDone ? <Check className="size-4" /> : index + 1}
                </span>
                {index < STEPS.length - 1 ? (
                  <span className="bg-muted mx-2 h-px flex-1" />
                ) : null}
              </div>
              <span className="text-muted-foreground hidden text-center text-xs sm:block">
                {stepItem.label}
              </span>
            </li>
          )
        })}
      </ol>

      <Card>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {step === 0 ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="arenaName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da arena</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Arena XP" {...field} onBlur={fillSlugIfEmpty} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identificador público</FormLabel>
                        <FormControl>
                          <Input placeholder="ex.: arena-xp" {...field} />
                        </FormControl>
                        <FormDescription>
                          Usado em links públicos e no QR Code. Somente minúsculas, números e hífens.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, número" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              maxLength={2}
                              className="uppercase"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="courtName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da quadra</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Quadra 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="courtSport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SPORTS.map((sport) => (
                              <SelectItem key={sport} value={sport}>
                                {sport}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="deviceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do dispositivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex.: Câmera Lateral" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="devicePosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posição da câmera</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a posição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITIONS.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <PartyPopper className="text-primary size-6" />
                    <div>
                      <p className="font-medium">Tudo pronto!</p>
                      <p className="text-muted-foreground text-sm">
                        Confira as informações antes de criar sua arena.
                      </p>
                    </div>
                  </div>
                  <dl className="divide-y rounded-md border text-sm">
                    <SummaryRow label="Arena" value={form.getValues('arenaName')} />
                    <SummaryRow label="Identificador" value={form.getValues('slug')} />
                    <SummaryRow
                      label="Quadra"
                      value={`${form.getValues('courtName')} (${form.getValues('courtSport')})`}
                    />
                    <SummaryRow
                      label="Dispositivo"
                      value={`${form.getValues('deviceName')} · ${form.getValues('devicePosition')}`}
                    />
                  </dl>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 0 || createArena.isPending}
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={() => void handleNext()}>
                    Continuar
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={createArena.isPending}>
                    {createArena.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Criar arena
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || '—'}</dd>
    </div>
  )
}
