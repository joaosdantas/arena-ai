import { useState } from 'react'

import { CameraOff, Copy, Link2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

import { QrCode } from '@/components/common/qr-code'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { CaptureDeviceStatusBadge } from '@/modules/arena/components/arena-status-badge'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'
import { useUnpairDevice } from '@/modules/arena/hooks/use-unpair-device'
import type { CaptureDeviceView } from '@/modules/arena/types/arena-dashboard.types'

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado`)
  } catch {
    toast.error(`Não foi possível copiar o ${label.toLowerCase()}`)
  }
}

export function CaptureDeviceCard({ device }: { device: CaptureDeviceView }) {
  const { data: arena } = useCurrentArena()
  const unpair = useUnpairDevice(arena?.id)
  const [confirming, setConfirming] = useState(false)

  function handleUnpair() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    unpair.mutate(device.id)
  }

  return (
    <Card className="gap-4">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold">{device.name}</h3>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5" />
            {device.courtName}
            {device.position ? <span>· {device.position}</span> : null}
          </div>
        </div>
        <CaptureDeviceStatusBadge status={device.status} presence={device.presence} />
      </CardContent>

      <CardContent className="flex flex-col items-center gap-3 pt-0">
        <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-xl border p-4">
          <QrCode value={device.pairingUrl} size={168} />
          <div className="flex w-full flex-col gap-1.5">
            <button
              type="button"
              onClick={() => void copyToClipboard(device.pairingUrl, 'Link de pareamento')}
              className="hover:bg-muted flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Link2 className="text-muted-foreground size-4 shrink-0" />
                <code className="text-muted-foreground truncate text-xs">{device.pairingUrl}</code>
              </span>
              <Copy className="text-muted-foreground size-3.5 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => void copyToClipboard(device.qrCode, 'Código')}
              className="hover:bg-muted flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors"
            >
              <span className="text-muted-foreground min-w-0 flex-1 text-xs">{device.qrCode}</span>
              <Copy className="text-muted-foreground size-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {device.paired ? (
          <div className="flex w-full flex-col items-center gap-1.5">
            <p className="text-muted-foreground text-xs">
              Pareado a um celular — o QR continua válido para novo pareamento após desconectar.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={unpair.isPending}
              onClick={handleUnpair}
            >
              <CameraOff className="size-4" />
              {confirming ? 'Confirmar desconexão?' : 'Desconectar dispositivo'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
