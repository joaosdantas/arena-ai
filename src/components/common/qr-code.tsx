import * as QRCode from 'qrcode'

import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'

interface QrCodeProps {
  value: string
  size?: number
  className?: string
}

export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [value, size])

  if (!dataUrl) {
    return (
      <Skeleton className={cn('rounded-lg', className)} style={{ width: size, height: size }} />
    )
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code de pareamento"
      width={size}
      height={size}
      className={cn('h-auto rounded-lg bg-white p-1', className)}
    />
  )
}
