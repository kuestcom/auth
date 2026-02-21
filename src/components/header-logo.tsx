import Link from 'next/link'
import { SiteLogoIcon } from '@/components/site-logo-icon'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Kuest'

export function HeaderLogo() {
  return (
    <Link
      href="/"
      className={`
        flex h-10 shrink-0 items-center gap-2 text-2xl font-medium text-foreground transition-opacity
        hover:opacity-80
      `}
    >
      <SiteLogoIcon
        alt={`${SITE_NAME} logo`}
        className="size-[1em]"
        imageClassName="object-contain"
        size={32}
      />
      <span>{SITE_NAME}</span>
    </Link>
  )
}
