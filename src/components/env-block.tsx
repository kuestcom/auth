'use client'

import type { KeyBundle } from '@/types/keygen'

import { useMemo } from 'react'
import { CopyButton } from '@/components/copy-button'

interface EnvBlockProps {
  bundle: KeyBundle | null
}

export function EnvBlock({ bundle }: EnvBlockProps) {
  const credentialsBlock = useMemo(() => {
    if (!bundle) {
      return ''
    }

    return [
      `KUEST_ADDRESS=${bundle.address}`,
      `KUEST_API_KEY=${bundle.apiKey}`,
      `KUEST_API_SECRET=${bundle.apiSecret}`,
      `KUEST_PASSPHRASE=${bundle.passphrase}`,
    ].join('\n')
  }, [bundle])

  if (!bundle) {
    return null
  }

  return (
    <div className="relative">
      <CopyButton
        value={credentialsBlock}
        ariaLabel="Copy credentials block"
        className="absolute top-3 right-3 z-10"
      />
      <textarea
        value={credentialsBlock}
        readOnly
        rows={6}
        className={`
          w-full resize-none rounded-xl border border-border/70 bg-background/70 px-4 pt-12 pb-4 font-mono
          text-xs/relaxed text-foreground outline-none
        `}
      />
    </div>
  )
}
