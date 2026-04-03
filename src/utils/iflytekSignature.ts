// 科大讯飞 API 签名生成工具
// 文档: https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html

import { iflytekConfig } from '@/config/iflytek'

/**
 * 生成科大讯飞 API 签名
 * @param params 请求参数对象（不包含 signature）
 * @param apiSecret API 密钥
 * @returns Base64 编码的签名
 */
export async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  // 1. 将参数按 key 升序排序
  const sortedKeys = Object.keys(params).sort()

  // 2. 对 key 和 value 进行 URL 编码
  const encodedParams = sortedKeys.map(key => {
    const encodedKey = encodeURIComponent(key)
    const encodedValue = encodeURIComponent(params[key])
    return `${encodedKey}=${encodedValue}`
  })

  // 3. 拼接参数字符串
  const paramString = encodedParams.join('&')

  // 4. HmacSHA1 加密
  const signature = await hmacSha1(paramString, apiSecret)

  // 5. Base64 编码
  return btoa(signature)
}

/**
 * 构建 WebSocket 连接 URL（包含签名参数）
 * @param config iFlytek 配置
 * @returns 完整的 WebSocket URL
 */
export async function buildWebSocketUrl(config: typeof iflytekConfig): Promise<string> {
  // 生成当前时间戳 (ISO 8601 格式)
  const now = new Date()
  const utc = formatISO8601(now)

  // 构建请求参数
  const params: Record<string, string> = {
    appId: config.appId,
    accessKeyId: config.apiKey,
    utc: utc,
    lang: 'autodialect',        // 中英+202方言混合识别
    audio_encode: 'opus-wb',    // Opus 格式（推荐）
    samplerate: '16000'         // 采样率 16kHz
  }

  // 生成签名
  const signature = await generateSignature(params, config.apiSecret)
  params.signature = signature

  // 构建 URL 查询字符串
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  return `${config.wsUrl}?${queryString}`
}

/**
 * 格式化时间为 ISO 8601 格式
 * @param date 日期对象
 * @returns ISO 8601 格式字符串 (如: 2025-09-04T15:38:07+0800)
 */
function formatISO8601(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 获取时区偏移（分钟）
  const offset = date.getTimezoneOffset()
  const offsetHours = Math.abs(Math.floor(offset / 60))
  const offsetMinutes = Math.abs(offset % 60)
  const offsetSign = offset <= 0 ? '+' : '-'

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}${String(offsetMinutes).padStart(2, '0')}`
}

/**
 * HmacSHA1 加密（使用 Web Crypto API）
 * @param text 待加密文本
 * @param secret 密钥
 * @returns 二进制数据转换为字符串
 */
async function hmacSha1(text: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const textData = encoder.encode(text)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textData
  )

  // 转换为字符串
  return Array.from(new Uint8Array(signature))
    .map(b => String.fromCharCode(b))
    .join('')
}
