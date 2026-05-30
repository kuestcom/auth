export interface Env {
  ASSETS: Fetcher
  SITE_NAME?: string
  KUEST_CHAIN_MODE?: string
  KUEST_DEBUG_ERRORS?: string
  REOWN_APPKIT_PROJECT_ID?: string
  APP_URL?: string
  APP_ICON?: string
  CLOB_URL?: string
  RELAYER_URL?: string
  KUEST_BASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  SUPABASE_PUBLISHABLE_KEY?: string
  NEXT_PUBLIC_SITE_NAME?: string
  NEXT_PUBLIC_KUEST_CHAIN_MODE?: string
  NEXT_PUBLIC_KUEST_DEBUG_ERRORS?: string
  NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID?: string
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_APP_ICON?: string
  NEXT_PUBLIC_FORKAST_BASE_URL?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
}

export interface RuntimeConfig {
  siteName: string
  kuestChainMode: 'amoy' | 'polygon'
  reownAppKitProjectId: string
  appUrl: string
  appIcon: string
}

export interface KeyBundle {
  apiKey: string
  apiSecret: string
  passphrase: string
}

export interface CreateKuestKeyInput {
  address: string
  signature: string
  timestamp: string
  nonce: string
}

export interface KuestAuthContext {
  address: string
  apiKey: string
  apiSecret: string
  passphrase: string
}

export interface KuestKeyMetadata {
  apiKey: string
  nonce: string | null
  status: string
}
