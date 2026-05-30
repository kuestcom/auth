# API Contracts

All routes are same-origin Worker routes. Responses are JSON and include `cache-control: no-store`.

Errors use:

```json
{
  "error": {
    "message": "Readable error message"
  }
}
```

## `GET /api/config`

Returns browser-safe runtime configuration.

Response:

```json
{
  "siteName": "Kuest",
  "kuestChainMode": "amoy",
  "reownAppKitProjectId": "project-id",
  "appUrl": "https://auth.kuest.com",
  "appIcon": "https://auth.kuest.com/kuest-logo.svg"
}
```

## `POST /api/kuest/create-key`

Mints or derives Kuest credentials after the wallet signs the EIP-712 attestation.

Request:

```json
{
  "address": "0x...",
  "signature": "0x...",
  "timestamp": "1770000000",
  "nonce": "0"
}
```

Worker behavior:

- Sends `POST /auth/api-key` to every configured Kuest base URL.
- If all create calls fail, tries `GET /auth/derive-api-key`.
- Requires all successful services to return matching credentials.

Kuest request headers:

```text
KUEST_ADDRESS: 0x...
KUEST_SIGNATURE: 0x...
KUEST_TIMESTAMP: 1770000000
KUEST_NONCE: 0
```

Response:

```json
{
  "apiKey": "uuid",
  "apiSecret": "base64-secret",
  "passphrase": "passphrase"
}
```

## `POST /api/kuest/list-keys`

Lists key metadata for the active wallet credentials. This route uses L2 HMAC signing inside the Worker.

Request:

```json
{
  "address": "0x...",
  "apiKey": "uuid",
  "apiSecret": "base64-secret",
  "passphrase": "passphrase"
}
```

Worker behavior:

- Sends `GET /auth/api-keys?metadata=true&includeRevoked=true` to every configured Kuest base URL.
- Signs `timestamp + GET + /auth/api-keys`.
- Merges duplicate keys by `apiKey`.
- Keeps the greatest numeric nonce for each key.
- Treats a key as active if any service returns `status: "active"`.

Response:

```json
{
  "keys": [
    {
      "apiKey": "uuid",
      "nonce": "0",
      "status": "active"
    }
  ]
}
```

## `POST /api/kuest/revoke-key`

Revokes one Kuest API key.

Request:

```json
{
  "auth": {
    "address": "0x...",
    "apiKey": "uuid",
    "apiSecret": "base64-secret",
    "passphrase": "passphrase"
  },
  "apiKey": "uuid-to-revoke"
}
```

Worker behavior:

- Sends `DELETE /auth/api-key?apiKey=uuid-to-revoke` to every configured Kuest base URL.
- Signs `timestamp + DELETE + /auth/api-key`.
- Succeeds if at least one service revokes successfully.

Response:

```json
{
  "ok": true
}
```

## `POST /api/key-emails`

Stores the optional email associated with a generated API key.

Request:

```json
{
  "apiKey": "uuid",
  "email": "you@team.com"
}
```

Worker behavior:

- Inserts `{ api_key, email }` into `public.key_emails` through PostgreSQL.
- Uses `POSTGRES_URL`.
- Translates unique constraint conflicts into `duplicate`.

Response:

```json
{
  "status": "saved"
}
```

Duplicate response:

```json
{
  "status": "duplicate"
}
```
