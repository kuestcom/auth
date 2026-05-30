import type { ReactNode } from 'react'
import type { RuntimeConfig } from '@/types/runtime-config'
import { useEffect, useMemo, useState } from 'react'
import { RuntimeConfigContext } from '@/hooks/useRuntimeConfig'
import { getRuntimeConfig } from '@/lib/api'

interface RuntimeConfigProviderProps {
  children: ReactNode
}

export function RuntimeConfigProvider({ children }: RuntimeConfigProviderProps) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(function loadRuntimeConfig() {
    let active = true

    getRuntimeConfig()
      .then((nextConfig) => {
        if (!active) {
          return
        }
        setConfig(nextConfig)
        setError(
          nextConfig.reownAppKitProjectId.trim()
            ? null
            : 'Wallet connection is not configured.',
        )
      })
      .catch((requestError) => {
        if (!active) {
          return
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load runtime config.',
        )
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ config, loading, error }),
    [config, loading, error],
  )

  return (
    <RuntimeConfigContext value={value}>
      {children}
    </RuntimeConfigContext>
  )
}
