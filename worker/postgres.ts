import type { SaveKeyEmailInput } from '../shared/api'
import type { Env } from './types'
import postgres from 'postgres'
import { HttpError } from './http'

interface PostgresError extends Error {
  code?: string
}

function getPostgresUrl(env: Env) {
  const value = env.POSTGRES_URL?.trim()
  if (!value) {
    throw new HttpError(500, 'Postgres connection is not configured.')
  }
  return value
}

export async function saveKeyEmail(env: Env, input: SaveKeyEmailInput) {
  const sql = postgres(getPostgresUrl(env), {
    max: 1,
    prepare: false,
    fetch_types: false,
  })

  try {
    await sql`
      insert into public.key_emails (api_key, email)
      values (${input.apiKey}::uuid, ${input.email})
    `

    return { status: 'saved' as const }
  }
  catch (error) {
    if (error instanceof Error && (error as PostgresError).code === '23505') {
      return { status: 'duplicate' as const }
    }

    console.warn('[postgres] key email insert failed', {
      code: error instanceof Error ? (error as PostgresError).code : undefined,
      message: error instanceof Error ? error.message : String(error),
    })
    throw new HttpError(502, 'Postgres rejected this request.')
  }
  finally {
    await sql.end({ timeout: 1 })
  }
}
