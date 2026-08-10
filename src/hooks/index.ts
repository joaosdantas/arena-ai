import * as React from 'react'
import { useSyncExternalStore } from 'react'

import { useTheme } from '@/contexts/theme-context'

export { useTheme }

export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', callback)
      return () => media.removeEventListener('change', callback)
    },
    [query],
  )

  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
