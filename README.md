<h1 align="center">
  <img src="https://github.com/user-attachments/assets/0cc687fb-89c4-43fa-a056-d89c307215ad" alt="Kuest" height="96" /><br/>
  Kuest Auth Key Generator
</h1>

Single-page app that lets a Kuest wallet owner mint API credentials (L1 signature) and manage keys (L2 HMAC) against `https://clob.kuest.com`.

### Required environment variables

Configure these before running locally or deploying to Vercel:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_KUEST_CHAIN_MODE` | Required signing chain: `amoy` (default) or `polygon` |
| `NEXT_PUBLIC_SITE_NAME` | Brand name shown in header and wallet metadata |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon service key |
| `NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID` | Reown / WalletConnect v2 project id (enables QR wallets) |
| `NEXT_PUBLIC_APP_URL` | Public base URL of this app (used for WalletConnect metadata) |
| `NEXT_PUBLIC_APP_ICON` | Absolute URL to an app icon (WalletConnect metadata) |

Use `.env.example` as a starting point and create a `.env.local` file (Next.js automatically loads it):

```bash
NEXT_PUBLIC_KUEST_CHAIN_MODE=amoy
NEXT_PUBLIC_SITE_NAME=Kuest
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_REOWN_APPKIT_PROJECT_ID=...
NEXT_PUBLIC_APP_URL=https://auth.kuest.com
NEXT_PUBLIC_APP_ICON=https://auth.kuest.com/kuest-logo.svg
```

### Supabase schema

Apply the SQL migration in `supabase/migrations/0001_key_emails.sql` to create the anonymous insert-only table used to store `{ api_key, email }` pairs:

```bash
supabase db push
```

(Alternatively, run the file contents in the Supabase SQL editor.)

### Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and connect a Polygon (Mainnet 137 or Amoy 80002) wallet. The generate flow will:

1. Connect wallet via Reown (WalletConnect v2).
2. Switch to the required chain (`NEXT_PUBLIC_KUEST_CHAIN_MODE`; default `amoy`).
3. Sign the EIP-712 `ClobAuthDomain` payload and mint API credentials.
4. If an email was provided in advanced options, store `{ api_key, email }` in Supabase.
5. Manage keys (list / revoke) via L2 HMAC signing (`timestamp + method + path(+query) + body`).

### Deploying

Deploy to Vercel as a standard Next.js project. Set the environment variables above in the Vercel dashboard and (optionally) run the Supabase migration via CI before first deployment.
