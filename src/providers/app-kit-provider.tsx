import type { AppKit, OpenOptions, Views } from '@reown/appkit/react'
import type { ReactNode } from 'react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { createAppKit } from '@reown/appkit/react'
import { useEffect, useMemo, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { AppKitContext, defaultAppKitValue } from '@/hooks/useAppKit'
import {
  appKitFeatures,
  appKitThemeVariables,
  buildAppKitMetadata,
  featuredWalletIds,
  networks,
} from '@/lib/appkit'
import { useRuntimeConfig } from '@/hooks/useRuntimeConfig'
import type { RuntimeConfig } from '@/types/runtime-config'

let appKitInstance: AppKit | null = null
let appKitProjectId: string | null = null

function getOrCreateAppKit(
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

  useEffect(() => {
    if (!config.reownAppKitProjectId) {
      setAppKitValue(defaultAppKitValue)
      return
    }

    const instance = getOrCreateAppKit(config, wagmiAdapter)
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
  }, [config, wagmiAdapter])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as never}>
      <AppKitContext.Provider value={appKitValue}>
        {children}
      </AppKitContext.Provider>
    </WagmiProvider>
  )
}
