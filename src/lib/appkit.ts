import type { AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygon, polygonAmoy } from '@reown/appkit/networks'

export const projectId = process.env.NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID is not defined')
}

const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auth.kuest.com'
const appIconUrl = process.env.NEXT_PUBLIC_APP_ICON ?? `${defaultAppUrl}/kuest-logo.svg`
const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kuest'
const metamaskWalletId = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'

export const networks = [polygon, polygonAmoy] as [AppKitNetwork, ...AppKitNetwork[]]
export const defaultNetwork = polygon

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks,
})

export const wagmiConfig = wagmiAdapter.wagmiConfig

export const appKitMetadata = {
  name: `${siteName} Auth`,
  description: `Generate ${siteName} API credentials.`,
  url: defaultAppUrl,
  icons: [
    appIconUrl,
  ],
}

export const appKitThemeVariables = {
  '--w3m-font-family': 'var(--font-sans)',
  '--w3m-border-radius-master': '2px',
  '--w3m-accent': 'var(--primary)',
} as const

export const appKitFeatures = {
  analytics: process.env.NODE_ENV === 'production',
  history: false,
  onramp: false,
  swaps: false,
  receive: false,
  send: false,
}

export const featuredWalletIds = [metamaskWalletId]
