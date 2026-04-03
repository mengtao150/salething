// 科大讯飞实时语音转写 API 签名生成工具
// 文档: https://www.xfyun.cn/doc/asr/rtasr/API.html

import { iflytekConfig } from '@/config/iflytek'

/**
 * 生成科大讯飞实时语音转写 API 签名
 *
 * 签名生成公式: HmacSHA1(MD5(appid + ts), apiSecret)
 *
 * @param appId 应用ID
 * @param ts 当前时间戳（从1970年1月1日0点0分0秒开始到现在的秒数）
 * @param apiKey API密钥
 * @returns Base64 编码的签名
 */
export async function generateSignature(
  appId: string,
  ts: string,
  apiKey: string
): Promise<string> {
  // 1. 生成 baseString: appid + ts
  const baseString = appId + ts

  // 2. 对 baseString 进行 MD5
  const md5Hash = await md5(baseString)

  // 3. 使用 apiSecret 对 MD5 结果进行 HmacSHA1 加密
  const hmacSha1Signature = await hmacSha1(md5Hash, apiKey)

  // 4. 进行 Base64 编码
  return btoa(hmacSha1Signature)
}

/**
 * 构建 WebSocket 连接 URL（包含签名参数）
 * @param config iFlytek 配置
 * @returns 完整的 WebSocket URL
 */
export async function buildWebSocketUrl(config: typeof iflytekConfig): Promise<string> {
  // 生成当前时间戳（秒，从1970年1月1日0点0分0秒开始）
  const ts = Math.floor(Date.now() / 1000).toString()

  // 生成签名
  const signa = await generateSignature(config.appId, ts, config.apiKey)

  // 构建 URL 查询参数
  const params = new URLSearchParams({
    appid: config.appId,
    ts: ts,
    signa: signa,
    lang: 'cn'  // 中文识别
  })

  // 实时语音转写接口地址
  return `wss://rtasr.xfyun.cn/v1/ws?${params.toString()}`
}

/**
 * MD5 哈希函数
 */
async function md5(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * HmacSHA1 加密（使用 Web Crypto API）
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

  return Array.from(new Uint8Array(signature))
    .map(b => String.fromCharCode(b))
    .join('')
}
