import '@/index.css'

import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import { QueryClientProvider } from '@tanstack/react-query'

import { RouterProvider } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/theme-context'

import { queryClient } from '@/lib/query-client'

import { router } from '@/routes/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
