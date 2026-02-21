import Image from 'next/image'

interface SiteLogoIconProps {
  className?: string
  imageClassName?: string
  alt?: string
  size?: number
  logoImageUrl?: string
}

export function SiteLogoIcon({
  className = '',
  imageClassName = '',
  alt = 'Kuest logo',
  size = 32,
  logoImageUrl = '/kuest-logo.svg',
}: SiteLogoIconProps) {
  return (
    <span className={className}>
      <Image
        src={logoImageUrl}
        alt={alt}
        width={size}
        height={size}
        className={`size-full object-contain ${imageClassName}`}
      />
    </span>
  )
}
