export interface KeyBundle {
  apiKey: string
  apiSecret: string
  passphrase: string
  address: string
}

export type GeneratedKey = KeyBundle & {
  createdAt?: string
}

export interface KuestKeyMetadata {
  apiKey: string
  nonce: string | null
  status: string
}
