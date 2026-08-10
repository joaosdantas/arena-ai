import { Camera } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { LoadingState } from '@/components/common/loading-state'
import { PageHeader } from '@/components/common/page-header'

import { CaptureDeviceCard } from '@/modules/arena/components/capture-device-card'
import { useCaptureDevices } from '@/modules/arena/hooks/use-capture-devices'
import { useCurrentArena } from '@/modules/arena/hooks/use-arena'

export function ArenaDevicesPage() {
  const { data: arena } = useCurrentArena()
  const { data: devices, isLoading } = useCaptureDevices(arena?.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispositivos"
        description="Câmeras e QR Codes de pareamento"
      />

      {isLoading ? (
        <LoadingState label="Carregando dispositivos..." className="min-h-64" />
      ) : devices && devices.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <CaptureDeviceCard key={device.id} device={device} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Camera}
          title="Nenhum dispositivo"
          description="Cadastre uma câmera para gerar o QR Code de pareamento."
        />
      )}
    </div>
  )
}
