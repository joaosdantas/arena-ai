import { AlertCircle, Loader2, MapPin } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useArenas } from '@/modules/matches/hooks/use-arenas'

interface ArenaSelectProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

export function ArenaSelect({ value, onValueChange, disabled }: ArenaSelectProps) {
  const { data: arenas, isLoading, isError } = useArenas()

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-9 w-full items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Carregando arenas...
      </div>
    )
  }

  if (isError || !arenas || arenas.length === 0) {
    return (
      <div className="text-destructive flex h-9 w-full items-center gap-2 text-sm">
        <AlertCircle className="size-4" />
        Nenhuma arena disponível.
      </div>
    )
  }

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione a arena" />
      </SelectTrigger>
      <SelectContent>
        {arenas.map((arena) => (
          <SelectItem key={arena.id} value={arena.id}>
            <span className="flex items-center gap-2">
              <MapPin className="size-3.5" />
              {arena.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
