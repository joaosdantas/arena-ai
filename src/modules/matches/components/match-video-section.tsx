import { Clapperboard } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { MatchVideosSection } from '@/modules/videos'

interface MatchVideoSectionProps {
  matchId: string
}

export function MatchVideoSection({ matchId }: MatchVideoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clapperboard className="text-primary size-4" />
          Gravação da partida
        </CardTitle>
        <CardDescription>Assista, envie ou gerencie a gravação desta partida.</CardDescription>
      </CardHeader>
      <CardContent>
        <MatchVideosSection matchId={matchId} />
      </CardContent>
    </Card>
  )
}
