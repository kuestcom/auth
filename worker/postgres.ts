import type { SaveKeyEmailInput } from '../shared/api'
import type { Env } from './types'
import postgres from 'postgres'
import { HttpError } from './http'

interface PostgresError extends Error {
  code?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getPostgresUrl(env: Env) {
  const value = env.POSTGRES_URL?.trim()
  if (!value) {
    throw new HttpError(500, 'Postgres connection is not configured.')
  }
  return value
}

function validateSaveKeyEmailInput(input: SaveKeyEmailInput) {
  if (!UUID_PATTERN.test(input.apiKey)) {
    throw new HttpError(400, 'apiKey must be a valid UUID.')
  }

  if (input.email.indexOf('@') <= 0) {
    throw new HttpError(400, 'email must be a valid email address.')
  }
}

function clientInputErrorFromPostgres(error: unknown) {
  if (!(error instanceof Error)) {
    return null
  }

  const code = (error as PostgresError).code
  if (code === '22P02') {
    return new HttpError(400, 'apiKey must be a valid UUID.')
  }
  if (code === '23514') {
    return new HttpError(400, 'email must be a valid email address.')
  }

  return null
}

export async function saveKeyEmail(env: Env, input: SaveKeyEmailInput) {
  validateSaveKeyEmailInput(input)

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

    const clientError = clientInputErrorFromPostgres(error)
    if (clientError) {
      throw clientError
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
