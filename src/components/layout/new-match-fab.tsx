import { Plus } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'

import { appPaths } from '@/routes/paths'

export function NewMatchFab() {
  const navigate = useNavigate()

  return (
    <div className="fixed right-4 bottom-24 z-40 md:hidden">
      <Button
        size="lg"
        className="bg-brand text-brand-foreground shadow-brand/40 h-14 rounded-full px-5 shadow-lg hover:bg-brand/90"
        onClick={() => navigate(appPaths.matchesNew)}
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Nova partida
      </Button>
    </div>
  )
}
