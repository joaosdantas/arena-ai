import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateSession } from '@/modules/arena/hooks/use-session-lifecycle'
import { useCourts } from '@/modules/arena/hooks/use-courts'
import type { CourtView } from '@/modules/arena/types/arena-dashboard.types'

import type { SessionStatus } from '@/types/domain'

interface NewSessionSheetProps {
  arenaId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewSessionSheet({ arenaId, open, onOpenChange }: NewSessionSheetProps) {
  const { data: courts } = useCourts(arenaId)
  const createSession = useCreateSession()

  const [courtId, setCourtId] = useState('')
  const [status, setStatus] = useState<SessionStatus>('scheduled')

  function submit() {
    if (!courtId) return
    createSession.mutate(
      { courtId, status },
      {
        onSuccess: () => {
          onOpenChange(false)
          setCourtId('')
          setStatus('scheduled')
        },
      },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nova sessão</SheetTitle>
          <SheetDescription>
            Escolha a quadra e o tipo de sessão de captura.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Quadra</span>
            <Select value={courtId} onValueChange={setCourtId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a quadra" />
              </SelectTrigger>
              <SelectContent>
                {(courts ?? []).map((court: CourtView) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name} · {court.sport ?? 'Sem modalidade'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Início</span>
            <Select value={status} onValueChange={(value) => setStatus(value as SessionStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendar</SelectItem>
                <SelectItem value="active">Iniciar agora</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {status === 'active'
                ? 'A sessão começa imediatamente e o celular pareado pode gravar.'
                : 'A sessão fica agendada até ser iniciada pelo dashboard.'}
            </p>
          </div>
        </div>

        <SheetFooter>
          <Button
            disabled={!courtId || createSession.isPending}
            onClick={submit}
          >
            {createSession.isPending ? 'Criando...' : 'Criar sessão'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
