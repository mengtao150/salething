import { iflytekConfig } from '@/config/iflytek'

function toBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
}

async function hmacSha256Base64(message: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const bytes = new Uint8Array(signature)
  let binary = ''

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function formatRfc1123Date(date = new Date()) {
  return date.toUTCString()
}

export async function buildWebSocketUrl(config: typeof iflytekConfig = iflytekConfig) {
  const url = new URL(config.wsUrl)
  const host = url.host
  const path = url.pathname
  const date = formatRfc1123Date()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const signature = await hmacSha256Base64(signatureOrigin, config.apiSecret)
  const authorizationOrigin =
    `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = toBase64(authorizationOrigin)

  url.searchParams.set('authorization', authorization)
  url.searchParams.set('date', date)
  url.searchParams.set('host', host)

  return url.toString()
}
