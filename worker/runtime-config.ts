import type { Env, RuntimeConfig } from './types'

function firstEnv(env: Env, ...keys: Array<keyof Env>) {
  for (const key of keys) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export function flagEnabled(value: string | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized === '1'
    || normalized === 'true'
    || normalized === 'yes'
    || normalized === 'on'
}

export function getRuntimeConfig(env: Env): RuntimeConfig {
  const siteName = firstEnv(env, 'SITE_NAME', 'NEXT_PUBLIC_SITE_NAME') || 'Kuest'
  const chainModeRaw = firstEnv(
    env,
    'KUEST_CHAIN_MODE',
    'NEXT_PUBLIC_KUEST_CHAIN_MODE',
  ).toLowerCase()
  const kuestChainMode = chainModeRaw === 'polygon' ? 'polygon' : 'amoy'
  const appUrl = firstEnv(env, 'APP_URL', 'NEXT_PUBLIC_APP_URL')
    || 'https://auth.kuest.com'
  const appIcon = firstEnv(env, 'APP_ICON', 'NEXT_PUBLIC_APP_ICON')
    || `${appUrl.replace(/\/+$/, '')}/kuest-logo.svg`

  return {
    siteName,
    kuestChainMode,
    reownAppKitProjectId: firstEnv(
      env,
      'REOWN_APPKIT_PROJECT_ID',
      'NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID',
    ),
    appUrl,
    appIcon,
  }
}

export function getKuestBaseUrls(env: Env) {
  const values = [
    firstEnv(env, 'CLOB_URL', 'KUEST_BASE_URL', 'NEXT_PUBLIC_FORKAST_BASE_URL'),
    firstEnv(env, 'RELAYER_URL'),
  ].filter(Boolean)

  const unique = Array.from(new Set(values))
  if (unique.length === 0) {
    throw new Error('CLOB_URL or RELAYER_URL must be defined.')
  }
  return unique
}

export function getSupabaseConfig(env: Env) {
  const url = firstEnv(env, 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = firstEnv(
    env,
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  )

  if (!url || !anonKey) {
    throw new Error(
      'Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    )
  }

  return {
    url: url.replace(/\/+$/, ''),
    anonKey,
  }
}

export function kuestDebugErrorsEnabled(env: Env) {
  return flagEnabled(env.KUEST_DEBUG_ERRORS ?? env.NEXT_PUBLIC_KUEST_DEBUG_ERRORS)
}
