import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  env: {
    CLOB_URL: process.env.CLOB_URL ?? 'https://clob.forka.st',
    RELAYER_URL: process.env.RELAYER_URL ?? 'https://relayer.forka.st',
  },
}

export default nextConfig
