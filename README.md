# Kuest Auth Worker

Single-page Kuest API credential generator built for Cloudflare Workers.

The UI is a React/Vite static asset bundle, and all `/api/*` requests are handled by a native Cloudflare Worker.

## Runtime

- UI: React + Vite + Tailwind CSS.
- Wallet: Reown AppKit + Wagmi.
- Server: Cloudflare Worker TypeScript.
- Database: PostgreSQL insert into `public.key_emails`.

## Environment Variables

Set these as Cloudflare Worker variables/secrets. For local development, copy `.dev.vars.example` to `.dev.vars`.

| Variable | Description |
| --- | --- |
| `KUEST_CHAIN_MODE` | `amoy` or `polygon`; defaults to `amoy` |
| `SITE_NAME` | Brand name shown in the UI |
| `REOWN_APPKIT_PROJECT_ID` | Reown / WalletConnect project id |
| `APP_URL` | Public app URL used in wallet metadata |
| `APP_ICON` | Public app icon URL used in wallet metadata |
| `CLOB_URL` | Kuest CLOB base URL, usually `https://clob.kuest.com` |
| `RELAYER_URL` | Kuest relayer base URL, usually `https://relayer.kuest.com` |
| `POSTGRES_URL` | PostgreSQL connection string used by the Worker; include SSL settings if your provider requires them |
| `KUEST_DEBUG_ERRORS` | `true` to include raw Kuest error fragments in UI messages |

## Development

```bash
npm install
npm run dev
```

`npm run dev` runs the Vite + Cloudflare Worker dev environment. The app fetches runtime config from `/api/config`, so `.dev.vars` must include `REOWN_APPKIT_PROJECT_ID`.

## Validation

```bash
npm run check
npm run build
```

## Deploy

```bash
npm run deploy
```

The build emits:

- `dist/client`: static UI assets.
- `dist/kuest_auth`: Worker bundle and generated Wrangler config.

## Database

Apply the SQL migrations in `db/migrations` to any PostgreSQL database before first deploy.

```bash
psql "$POSTGRES_URL" -f db/migrations/0001_key_emails.sql
```

## API Contracts

See [docs/api.md](docs/api.md).
