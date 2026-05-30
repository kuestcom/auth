const textEncoder = new TextEncoder()

function base64ToUint8Array(base64: string) {
  const normalized = base64
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const binaryString = atob(normalized)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

function toBase64Url(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes)
  let binary = ''

  for (let i = 0; i < view.length; i += 1) {
    binary += String.fromCharCode(view[i])
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
}

export async function hmacSha256Base64Url(
  secretBase64: string,
  message: string,
) {
  const secretBytes = base64ToUint8Array(secretBase64)
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(message),
  )
  return toBase64Url(signature)
}
