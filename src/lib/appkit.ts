import type { AppKitNetwork } from '@reown/appkit/networks'
import type { RuntimeConfig } from '@/types/runtime-config'
import { polygon, polygonAmoy } from '@reown/appkit/networks'

const metamaskWalletId = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'

export const networks = [polygon, polygonAmoy] as [
  AppKitNetwork,
  ...AppKitNetwork[],
]

export function buildAppKitMetadata(config: RuntimeConfig) {
  return {
    name: `${config.siteName} Auth`,
    description: `Generate ${config.siteName} API credentials.`,
    url: config.appUrl,
    icons: [
      config.appIcon,
    ],
  }
}

export const appKitThemeVariables = {
  '--w3m-font-family': 'var(--font-sans)',
  '--w3m-border-radius-master': '2px',
  '--w3m-accent': 'var(--primary)',
} as const

export const appKitFeatures = {
  analytics: import.meta.env.PROD,
  history: false,
  onramp: false,
  swaps: false,
  receive: false,
  send: false,
}

export const featuredWalletIds = [metamaskWalletId]
