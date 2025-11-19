export function shortenAddress(address?: string, chars = 4) {
  if (!address) {
    return ''
  }
  const prefixLength = Math.max(chars, 2)
  const suffixLength = Math.max(chars, 2)
  return `${address.slice(0, prefixLength + 2)}…${address.slice(-suffixLength)}`
}
