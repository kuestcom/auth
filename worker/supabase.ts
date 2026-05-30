import type { Env } from './types'
import { HttpError, readJsonSafely } from './http'
import { getSupabaseConfig } from './runtime-config'

export async function saveKeyEmail(
  env: Env,
  input: {
    apiKey: string
    email: string
  },
) {
  const { url, anonKey } = getSupabaseConfig(env)
  const response = await fetch(`${url}/rest/v1/key_emails`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      api_key: input.apiKey,
      email: input.email,
    }),
  })

  if (response.ok) {
    return { status: 'saved' as const }
  }

  const payload = await readJsonSafely(response)
  const code = payload && typeof payload === 'object'
    ? (payload as { code?: string }).code
    : undefined
  if (response.status === 409 || code === '23505') {
    return { status: 'duplicate' as const }
  }

  console.warn('[supabase] key email insert failed', {
    status: response.status,
    payload,
  })
  throw new HttpError(502, 'Supabase rejected this request.')
}
