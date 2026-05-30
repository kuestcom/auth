import type { KeyBundle, KuestKeyMetadata } from '@/types/keygen'
import type { RuntimeConfig } from '@/types/runtime-config'

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

async function parseResponseError(response: Response) {
  try {
    const payload = await response.json() as unknown
    if (payload && typeof payload === 'object') {
      const error = (payload as { error?: { message?: string } }).error
      const message = error?.message
        ?? (payload as { message?: string }).message
        ?? (payload as { error?: string }).error
      if (typeof message === 'string' && message.trim()) {
        return message
      }
    }
  }
  catch {
    // Fall through to generic status text.
  }

  return response.statusText || 'Request failed.'
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(await parseResponseError(response))
  }

  return await response.json() as T
}

export function getRuntimeConfig() {
  return requestJson<RuntimeConfig>('/api/config', {
    method: 'GET',
  })
}

export async function createKuestKey(input: CreateKuestKeyInput) {
  const result = await requestJson<Omit<KeyBundle, 'address'>>(
    '/api/kuest/create-key',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )

  return result
}

export async function listKuestKeyMetadata(auth: KuestAuthContext) {
  const result = await requestJson<{ keys: KuestKeyMetadata[] }>(
    '/api/kuest/list-keys',
    {
      method: 'POST',
      body: JSON.stringify(auth),
    },
  )

  return result.keys
}

export async function listKuestKeys(auth: KuestAuthContext) {
  const keys = await listKuestKeyMetadata(auth)
  return keys
    .filter(key => key.status === 'active')
    .map(key => key.apiKey)
}

export async function revokeKuestKey(
  auth: KuestAuthContext,
  apiKey: string,
) {
  await requestJson<{ ok: true }>('/api/kuest/revoke-key', {
    method: 'POST',
    body: JSON.stringify({ auth, apiKey }),
  })
  return true
}

export async function saveKeyEmail(input: {
  apiKey: string
  email: string
}) {
  return requestJson<{ status: 'saved' | 'duplicate' }>('/api/key-emails', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

function parseKuestNonce(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const parsed = BigInt(value)
    return parsed < BigInt(0) ? null : parsed
  }
  catch {
    return null
  }
}

export function nextKuestNonceFromMetadata(keys: KuestKeyMetadata[]) {
  let maxNonce: bigint | null = null

  for (const key of keys) {
    const value = parseKuestNonce(key.nonce)
    if (value === null) {
      continue
    }
    if (maxNonce === null || value > maxNonce) {
      maxNonce = value
    }
  }

  return maxNonce === null ? '0' : (maxNonce + BigInt(1)).toString()
}
