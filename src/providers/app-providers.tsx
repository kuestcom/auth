import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { useRuntimeConfigState } from '@/hooks/useRuntimeConfig'
import AppKitProvider from '@/providers/app-kit-provider'
import { RuntimeConfigProvider } from '@/providers/runtime-config-provider'

interface AppProvidersProps {
  children: ReactNode
}

function RuntimeReady({ children }: AppProvidersProps) {
  const { config, loading, error } = useRuntimeConfigState()

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground" />
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="container">
          <div className="mx-auto max-w-xl auth-panel p-6">
            <h1 className="text-xl font-semibold">Configuration error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? 'Runtime config is not available.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <AppKitProvider>{children}</AppKitProvider>
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <RuntimeConfigProvider>
      <RuntimeReady>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </QueryClientProvider>
      </RuntimeReady>
    </RuntimeConfigProvider>
  )
}
