import type { AppKit, OpenOptions, Views } from '@reown/appkit/react'
import type { ReactNode } from 'react'
import type { RuntimeConfig } from '@/types/runtime-config'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { useEffect, useMemo, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { AppKitContext, defaultAppKitValue } from '@/hooks/useAppKit'
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig'
import {
  appKitFeatures,
  appKitThemeVariables,
  buildAppKitMetadata,
  featuredWalletIds,
  networks,
} from '@/lib/appkit'

let appKitInstance: AppKit | null = null
let appKitProjectId: string | null = null

async function getOrCreateAppKit(
  config: RuntimeConfig,
  wagmiAdapter: WagmiAdapter,
) {
  if (typeof window === 'undefined') {
    return null
  }
  if (!config.reownAppKitProjectId) {
    return null
  }

  if (appKitInstance && appKitProjectId === config.reownAppKitProjectId) {
    return appKitInstance
  }

  try {
    const { createAppKit } = await import('@reown/appkit/react')
    if (appKitInstance && appKitProjectId === config.reownAppKitProjectId) {
      return appKitInstance
    }

    appKitInstance = createAppKit({
      projectId: config.reownAppKitProjectId,
      adapters: [wagmiAdapter],
      networks,
      metadata: buildAppKitMetadata(config),
      themeMode: 'dark',
      themeVariables: appKitThemeVariables,
      features: appKitFeatures,
      featuredWalletIds,
      defaultAccountTypes: { eip155: 'eoa' },
    })
    appKitProjectId = config.reownAppKitProjectId
    return appKitInstance
  }
  catch (error) {
    console.warn('Wallet initialization failed. Using local/default values.', error)
    return null
  }
}

export default function AppKitProvider({ children }: { children: ReactNode }) {
  const config = useRuntimeConfig()
  const [appKitValue, setAppKitValue] = useState(defaultAppKitValue)

  const wagmiAdapter = useMemo(
    () => new WagmiAdapter({
      ssr: false,
      projectId: config.reownAppKitProjectId,
      networks,
    }),
    [config.reownAppKitProjectId],
  )

  useEffect(function initializeAppKit() {
    let active = true

    async function setInitializedAppKitValue() {
      const instance = await getOrCreateAppKit(config, wagmiAdapter)
      if (!active) {
        return
      }

      if (!instance) {
        setAppKitValue(defaultAppKitValue)
        return
      }

      setAppKitValue({
        open: async (options?: OpenOptions<Views>) => {
          await instance.open(options)
        },
        close: async () => {
          await instance.close()
        },
        isReady: true,
      })
    }

    void setInitializedAppKitValue()

    return () => {
      active = false
    }
  }, [config, wagmiAdapter])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as never}>
      <AppKitContext value={appKitValue}>
        {children}
      </AppKitContext>
    </WagmiProvider>
  )
}
