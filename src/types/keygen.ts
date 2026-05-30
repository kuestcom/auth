import type { KuestKeyBundle } from '../../shared/api'

export interface KeyBundle extends KuestKeyBundle {
  address: string
}

export type GeneratedKey = KeyBundle & {
  createdAt?: string
}

export type { KuestKeyMetadata } from '../../shared/api'
