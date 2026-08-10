import { Pencil, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import type { Match } from '@/modules/matches/types/match.types'

import { appPaths } from '@/routes/paths'

import { shareMatch } from '@/utils/share'

interface MatchActionsProps {
  match: Match
  onDelete: () => void
  isDeleting?: boolean
}

export function MatchActions({ match, onDelete, isDeleting }: MatchActionsProps) {
  const navigate = useNavigate()

  function handleShare() {
    void shareMatch(match)
      .then((result) => {
        toast.success(result === 'copied' ? 'Link copiado!' : 'Compartilhamento aberto.')
      })
      .catch(() => {
        toast.error('Não foi possível compartilhar esta partida.')
      })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate(appPaths.matchEdit(match.id))}>
        <Pencil className="size-4" />
        Editar
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="size-4" />
        Compartilhar
      </Button>
      <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
        <Trash2 className="size-4" />
        Excluir
      </Button>
    </div>
  )
}
