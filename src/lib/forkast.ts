import { hmacSha256Hex } from '@/lib/crypto';
import type { KeyBundle } from '@/types/keygen';

const DEFAULT_FORKAST_BASE_URL = 'https://clob.forka.st';
const MAX_ERROR_MESSAGE_LENGTH = 180;

const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: 'Forkast rejected this request. Check your inputs and try again.',
  401: 'Forkast rejected your credentials. Generate a new API key to continue.',
  403: 'Forkast rejected your credentials. Generate a new API key to continue.',
  404: 'Forkast could not find the requested resource.',
  429: 'Too many requests hit Forkast. Please wait and try again.',
  500: 'Forkast is temporarily unavailable. Try again shortly.',
  502: 'Forkast is temporarily unavailable. Try again shortly.',
  503: 'Forkast is temporarily unavailable. Try again shortly.',
};

function extractForkastErrorMessage(payload: unknown): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const message = extractForkastErrorMessage(entry);
      if (message) {
        return message;
      }
    }
    return undefined;
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidateKeys = ['message', 'error', 'detail', 'reason'];
    for (const key of candidateKeys) {
      if (key in record) {
        const message = extractForkastErrorMessage(record[key]);
        if (message) {
          return message;
        }
      }
    }
  }

  return undefined;
}

function sanitizeForkastError(
  status: number | undefined,
  rawMessage: string | undefined,
  fallback: string,
) {
  const canonical = status !== undefined ? STATUS_MESSAGE_MAP[status] : undefined;
  const normalizedRaw = rawMessage?.replace(/\s+/g, ' ').trim();
  const trimmedRaw = normalizedRaw
    ? normalizedRaw.slice(0, MAX_ERROR_MESSAGE_LENGTH)
    : undefined;
  const message = canonical ?? trimmedRaw ?? fallback;

  if (typeof status === 'number') {
    const suffix = ` (HTTP ${status})`;
    return message.includes(suffix) ? message : `${message}${suffix}`;
  }

  return message;
}

async function throwForkastError(response: Response, fallback: string): Promise<never> {
  let payload: unknown = null;
  let rawMessage: string | undefined;

  try {
    payload = await response.clone().json();
    rawMessage = extractForkastErrorMessage(payload);
  } catch {
    try {
      const text = await response.clone().text();
      if (text) {
        payload = text;
        rawMessage = extractForkastErrorMessage(text);
      }
    } catch {
      // ignore
    }
  }

  if (payload !== null || rawMessage) {
    console.error('Forkast API error', {
      status: response.status,
      message: rawMessage,
      payload,
    });
  }

  const message = sanitizeForkastError(response.status, rawMessage, fallback);
  throw new Error(message);
}

export function getForkastBaseUrl() {
  return process.env.NEXT_PUBLIC_FORKAST_BASE_URL ?? DEFAULT_FORKAST_BASE_URL;
}

type CreateForkastKeyInput = {
  address: string;
  signature: string;
  timestamp: string;
  nonce: string;
};

type ForkastAuthContext = {
  address: string;
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

function normalizeKeyBundle(payload: unknown): KeyBundle {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Unexpected response when minting API key.');
  }

  const unwrapNested = (value: unknown): Record<string, unknown> | null => {
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if ('data' in record && typeof record.data === 'object') {
        return record.data as Record<string, unknown>;
      }
      return record;
    }
    return null;
  };

  const record =
    unwrapNested(payload) ??
    (() => {
      throw new Error('Unexpected response when minting API key.');
    })();

  const readFirst = (...keys: string[]) => {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }
    return undefined;
  };

  const apiKey = readFirst('apiKey', 'api_key', 'key', 'id');
  const apiSecret = readFirst(
    'apiSecret',
    'api_secret',
    'apiSecretBase64',
    'api_secret_base64',
    'secret',
    'secretKey',
    'secret_key',
  );
  const passphrase = readFirst(
    'passphrase',
    'api_passphrase',
    'passphraseHex',
    'passphrase_hex',
    'api_passphrase_hex',
  );

  if (!apiKey || !apiSecret || !passphrase) {
    const keys = Object.keys(record).join(', ') || 'none';
    throw new Error(`Forkast did not return API credentials. Payload keys: ${keys}`);
  }

  return {
    apiKey,
    apiSecret,
    passphrase,
  };
}

export async function createForkastKey({
  address,
  signature,
  timestamp,
  nonce,
}: CreateForkastKeyInput) {
  const baseUrl = getForkastBaseUrl();
  const url = new URL('/auth/api-key', baseUrl);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      FORKAST_ADDRESS: address,
      FORKAST_SIGNATURE: signature,
      FORKAST_TIMESTAMP: timestamp,
      FORKAST_NONCE: nonce,
    },
  });

  if (!response.ok) {
    await throwForkastError(response, 'Failed to generate API key.');
  }

  const data = await response.json();
  return normalizeKeyBundle(data);
}

function buildHeaders({
  address,
  apiKey,
  passphrase,
  timestamp,
  signature,
}: {
  address: string;
  apiKey: string;
  passphrase: string;
  timestamp: string;
  signature: string;
}) {
  return {
    FORKAST_ADDRESS: address,
    FORKAST_API_KEY: apiKey,
    FORKAST_PASSPHRASE: passphrase,
    FORKAST_TIMESTAMP: timestamp,
    FORKAST_SIGNATURE: signature,
  };
}

async function signMessage({
  apiSecret,
  method,
  pathWithQuery,
  timestamp,
  body,
}: {
  apiSecret: string;
  method: string;
  pathWithQuery: string;
  timestamp: string;
  body?: string;
}) {
  const signingString = `${timestamp}${method.toUpperCase()}${pathWithQuery}${
    body ?? ''
  }`;
  return hmacSha256Hex(apiSecret, signingString);
}

export async function listForkastKeys(auth: ForkastAuthContext) {
  const baseUrl = getForkastBaseUrl();
  const path = '/auth/api-keys';
  const url = new URL(path, baseUrl);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = await signMessage({
    apiSecret: auth.apiSecret,
    method: 'GET',
    pathWithQuery: path,
    timestamp,
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders({
      address: auth.address,
      apiKey: auth.apiKey,
      passphrase: auth.passphrase,
      timestamp,
      signature,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    await throwForkastError(response, 'Failed to load keys.');
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response when listing keys.');
  }

  return data
    .map((value) => (typeof value === 'string' ? value : null))
    .filter((value): value is string => Boolean(value));
}

export async function revokeForkastKey(auth: ForkastAuthContext, apiKey: string) {
  const baseUrl = getForkastBaseUrl();
  const path = '/auth/api-key';
  const url = new URL(path, baseUrl);
  url.searchParams.set('apiKey', apiKey);

  const pathWithQuery = `${path}?${url.searchParams.toString()}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = await signMessage({
    apiSecret: auth.apiSecret,
    method: 'DELETE',
    pathWithQuery,
    timestamp,
  });

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: buildHeaders({
      address: auth.address,
      apiKey: auth.apiKey,
      passphrase: auth.passphrase,
      timestamp,
      signature,
    }),
  });

  if (!response.ok) {
    await throwForkastError(response, 'Failed to revoke key.');
  }

  const payload = await response.json().catch(() => ({}));
  const revoked =
    typeof payload === 'object' && payload !== null
      ? (payload as { revoked?: boolean }).revoked
      : undefined;

  return Boolean(revoked);
}
