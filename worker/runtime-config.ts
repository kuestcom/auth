import type { RuntimeConfig } from '../shared/api'
import type { Env } from './types'

function firstEnv(env: Env, ...keys: Array<keyof Env>) {
  for (const key of keys) {
    const value = env[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function flagEnabled(value: string | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized === '1'
    || normalized === 'true'
    || normalized === 'yes'
    || normalized === 'on'
}

export function getRuntimeConfig(env: Env): RuntimeConfig {
  const siteName = firstEnv(env, 'SITE_NAME') || 'Kuest'
  const chainModeRaw = firstEnv(
    env,
    'KUEST_CHAIN_MODE',
  ).toLowerCase()
  const kuestChainMode = chainModeRaw === 'polygon' ? 'polygon' : 'amoy'
  const appUrl = firstEnv(env, 'APP_URL') || 'https://auth.kuest.com'
  const appIcon = firstEnv(env, 'APP_ICON')
    || `${appUrl.replace(/\/+$/, '')}/kuest-logo.svg`

  return {
    siteName,
    kuestChainMode,
    reownAppKitProjectId: firstEnv(env, 'REOWN_APPKIT_PROJECT_ID'),
    appUrl,
    appIcon,
  }
}

export function getKuestBaseUrls(env: Env) {
  const values = [
    firstEnv(env, 'CLOB_URL'),
    firstEnv(env, 'RELAYER_URL'),
  ].filter(Boolean)

  const unique = Array.from(new Set(values))
  if (unique.length === 0) {
    throw new Error('CLOB_URL or RELAYER_URL must be defined.')
  }
  return unique
}

export function kuestDebugErrorsEnabled(env: Env) {
  return flagEnabled(env.KUEST_DEBUG_ERRORS)
}
