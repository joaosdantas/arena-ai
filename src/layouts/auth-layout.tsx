import { Outlet } from 'react-router-dom'

import { BrandLogo } from '@/components/common/brand-logo'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AuthLayout() {
  return (
    <div className="bg-muted/40 flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <BrandLogo />

      <Card className="w-full max-w-md">
        <CardHeader />
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">Arena AI — Plataforma de partidas esportivas</p>
    </div>
  )
}
