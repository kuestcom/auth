# Kuest Auth Worker

Single-page Kuest API credential generator built for Cloudflare Workers.

This is a new implementation without Next.js, Vercel runtime, or OpenNext. The UI is a React/Vite static asset bundle, and all `/api/*` requests are handled by a native Cloudflare Worker.

## Runtime

- UI: React + Vite + Tailwind CSS.
- Wallet: Reown AppKit + Wagmi.
- Server: Cloudflare Worker TypeScript.
- Database: Supabase via PostgREST insert into `public.key_emails`.

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
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon or publishable key with insert RLS access |
| `KUEST_DEBUG_ERRORS` | `true` to include raw Kuest error fragments in UI messages |

Legacy `NEXT_PUBLIC_*` variable names are accepted by the Worker for easier migration, but new Cloudflare deployments should use the names above.

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

## Supabase

The current migrations are copied into `supabase/migrations`. Apply them before first deploy:

```bash
supabase db push
```

## API Contracts

See [docs/api.md](docs/api.md).
