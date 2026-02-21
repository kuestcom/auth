import type { Metadata, Viewport } from 'next'

import { openSauceOne } from '@/lib/fonts'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Kuest'

export const metadata: Metadata = {
  title: `${siteName} API Key Generator`,
  description:
    `Connect your wallet to mint ${siteName} API credentials and manage keys in seconds.`,
  icons: {
    icon: '/kuest-logo.svg',
    shortcut: '/kuest-logo.svg',
    apple: '/kuest-logo.svg',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#181A1F' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={openSauceOne.variable}
      data-theme-mode="dark"
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
