import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  env: {
    CLOB_URL: 'https://clob.forka.st',
    RELAYER_URL: 'https://relayer.forka.st',
  },
}

export default nextConfig
