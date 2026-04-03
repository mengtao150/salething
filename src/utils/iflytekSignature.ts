// 科大讯飞中英识别大模型 API 签名生成工具
// 文档: https://www.xfyun.cn/doc/spark/spark_zh_iat.html

import { iflytekConfig } from '@/config/iflytek'

/**
 * 生成 RFC1123 格式的日期字符串
 * 示例: "Tue, 14 May 2024 08:46:48 GMT"
 */
export function generateRFC1123Date(): string {
  const date = new Date()
  return date.toUTCString()
}

/**
 * 生成科大讯飞中英识别大模型 API 签名
 *
 * 签名生成步骤:
 * 1. 生成 signature_origin: "host: iat.xf-yun.com\ndate: {date}\nGET /v1 HTTP/1.1"
 * 2. 使用 HMAC-SHA256 对 signature_origin 进行签名
 * 3. 对签名结果进行 Base64 编码得到 signature
 * 4. 生成 authorization_origin: `api_key="{apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature}"`
 * 5. 对 authorization_origin 进行 Base64 编码得到最终的 authorization
 *
 * @param apiKey API Key
 * @param apiSecret API Secret
 * @param date RFC1123 格式的日期字符串
 * @returns Base64 编码的 authorization 字符串
 */
export async function generateSparkSignature(
  apiKey: string,
  apiSecret: string,
  date: string
): Promise<string> {
  const host = 'iat.xf-yun.com'

  // 1. 生成 signature_origin
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1 HTTP/1.1`

  // 2. 使用 HMAC-SHA256 进行签名
  const encoder = new TextEncoder()
  const keyData = encoder.encode(apiSecret)
  const textData = encoder.encode(signatureOrigin)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textData
  )

  // 3. Base64 编码签名
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  // 4. 生成 authorization_origin
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`

  // 5. Base64 编码得到最终的 authorization
  return btoa(authorizationOrigin)
}

/**
 * 构建 WebSocket 连接 URL（包含签名参数）
 * @param config iFlytek 配置
 * @returns 完整的 WebSocket URL
 */
export async function buildSparkWebSocketUrl(config: typeof iflytekConfig): Promise<string> {
  // 生成 RFC1123 格式的日期
  const date = generateRFC1123Date()

  // 生成签名
  const authorization = await generateSparkSignature(config.apiKey, config.apiSecret, date)

  // 构建 URL 查询参数
  const params = new URLSearchParams({
    host: config.host,
    date: date,
    authorization: authorization
  })

  // 中英识别大模型接口地址
  return `${config.wsUrl}?${params.toString()}`
}
