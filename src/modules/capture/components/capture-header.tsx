import { BrandLogo } from '@/components/common/brand-logo'

export function CaptureHeader() {
  return (
    <header className="flex w-full items-center justify-center py-6">
      <a href="/" aria-label="Arena AI">
        <BrandLogo />
      </a>
    </header>
  )
}
