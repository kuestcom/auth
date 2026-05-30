import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getRuntimeConfig } from '@/lib/api'
import { RuntimeConfigContext } from '@/hooks/useRuntimeConfig'
import type { RuntimeConfig } from '@/types/runtime-config'

interface RuntimeConfigProviderProps {
  children: ReactNode
}

export function RuntimeConfigProvider({ children }: RuntimeConfigProviderProps) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
    <RuntimeConfigContext.Provider value={value}>
      {children}
    </RuntimeConfigContext.Provider>
  )
}
