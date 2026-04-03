// 科大讯飞实时语音转写 API 签名生成工具
// 文档: https://www.xfyun.cn/doc/asr/rtasr/API.html

import { iflytekConfig } from '@/config/iflytek'

/**
 * MD5 哈希函数（简化版实现）
 */
function md5(text: string): string {
  function md5cycle(x: number[], k: number[]): void {
    const a = x[0]
    const b = x[1]
    const c = x[2]
    const d = x[3]

    x[0] = ff(a, b, c, d, k[0], 7, -680876936)
    x[3] = ff(d, x[0], b, c, k[1], 12, -389564586)
    x[2] = ff(c, x[3], x[0], b, k[2], 17, 606105819)
    x[1] = ff(b, x[2], x[3], x[0], k[3], 22, -1044525330)
    x[0] = ff(x[0], x[1], x[2], x[3], k[4], 7, -176418897)
    x[3] = ff(x[3], x[0], x[1], x[2], k[5], 12, 1200080426)
    x[2] = ff(x[2], x[3], x[0], x[1], k[6], 17, -1473231341)
    x[1] = ff(x[1], x[2], x[3], x[0], k[7], 22, -45705983)
    x[0] = ff(x[0], x[1], x[2], x[3], k[8], 7, 1770035416)
    x[3] = ff(x[3], x[0], x[1], x[2], k[9], 12, -1958414417)
    x[2] = ff(x[2], x[3], x[0], x[1], k[10], 17, -42063)
    x[1] = ff(x[1], x[2], x[3], x[0], k[11], 22, -1990404162)
    x[0] = ff(x[0], x[1], x[2], x[3], k[12], 7, 1804603682)
    x[3] = ff(x[3], x[0], x[1], x[2], k[13], 12, -40341101)
    x[2] = ff(x[2], x[3], x[0], x[1], k[14], 17, -1502002290)
    x[1] = ff(x[1], x[2], x[3], x[0], k[15], 22, 1236535329)

    x[0] = gg(x[0], x[1], x[2], x[3], k[1], 5, -165796510)
    x[3] = gg(x[3], x[0], x[1], x[2], k[6], 9, -1069501632)
    x[2] = gg(x[2], x[3], x[0], x[1], k[11], 14, 643717713)
    x[1] = gg(x[1], x[2], x[3], x[0], k[0], 20, -373897302)
    x[0] = gg(x[0], x[1], x[2], x[3], k[5], 5, -701558691)
    x[3] = gg(x[3], x[0], x[1], x[2], k[10], 9, 38016083)
    x[2] = gg(x[2], x[3], x[0], x[1], k[15], 14, -660478335)
    x[1] = gg(x[1], x[2], x[3], x[0], k[4], 20, -405537848)
    x[0] = gg(x[0], x[1], x[2], x[3], k[9], 5, 568446438)
    x[3] = gg(x[3], x[0], x[1], x[2], k[14], 9, -1019803690)
    x[2] = gg(x[2], x[3], x[0], x[1], k[3], 14, -187363961)
    x[1] = gg(x[1], x[2], x[3], x[0], k[8], 20, 1163531501)
    x[0] = gg(x[0], x[1], x[2], x[3], k[13], 5, -1444681467)
    x[3] = gg(x[3], x[0], x[1], x[2], k[2], 9, -51403784)
    x[2] = gg(x[2], x[3], x[0], x[1], k[7], 14, 1735328473)
    x[1] = gg(x[1], x[2], x[3], x[0], k[12], 20, -1926607734)

    x[0] = hh(x[0], x[1], x[2], x[3], k[5], 4, -378558)
    x[3] = hh(x[3], x[0], x[1], x[2], k[8], 11, -2022574463)
    x[2] = hh(x[2], x[3], x[0], x[1], k[11], 16, 1839030562)
    x[1] = hh(x[1], x[2], x[3], x[0], k[14], 23, -35309556)
    x[0] = hh(x[0], x[1], x[2], x[3], k[1], 4, -1530992060)
    x[3] = hh(x[3], x[0], x[1], x[2], k[4], 11, 1272893353)
    x[2] = hh(x[2], x[3], x[0], x[1], k[7], 16, -155497632)
    x[1] = hh(x[1], x[2], x[3], x[0], k[10], 23, -1094730640)
    x[0] = hh(x[0], x[1], x[2], x[3], k[13], 4, 681279174)
    x[3] = hh(x[3], x[0], x[1], x[2], k[0], 11, -358537222)
    x[2] = hh(x[2], x[3], x[0], x[1], k[3], 16, -722521979)
    x[1] = hh(x[1], x[2], x[3], x[0], k[6], 23, 76029189)
    x[0] = hh(x[0], x[1], x[2], x[3], k[9], 4, -640364487)
    x[3] = hh(x[3], x[0], x[1], x[2], k[12], 11, -421815835)
    x[2] = hh(x[2], x[3], x[0], x[1], k[15], 16, 530742520)
    x[1] = hh(x[1], x[2], x[3], x[0], k[2], 23, -995338651)

    x[0] = ii(x[0], x[1], x[2], x[3], k[0], 6, -198630844)
    x[3] = ii(x[3], x[0], x[1], x[2], k[7], 10, 1126891415)
    x[2] = ii(x[2], x[3], x[0], x[1], k[14], 15, -1416354905)
    x[1] = ii(x[1], x[2], x[3], x[0], k[5], 21, -57434055)
    x[0] = ii(x[0], x[1], x[2], x[3], k[12], 6, 1700485571)
    x[3] = ii(x[3], x[0], x[1], x[2], k[3], 10, -1894986606)
    x[2] = ii(x[2], x[3], x[0], x[1], k[10], 15, -1051523)
    x[1] = ii(x[1], x[2], x[3], x[0], k[1], 21, -2054922799)
    x[0] = ii(x[0], x[1], x[2], x[3], k[8], 6, 1873313359)
    x[3] = ii(x[3], x[0], x[1], x[2], k[15], 10, -30611744)
    x[2] = ii(x[2], x[3], x[0], x[1], k[6], 15, -1560198380)
    x[1] = ii(x[1], x[2], x[3], x[0], k[13], 21, 1309151649)
    x[0] = ii(x[0], x[1], x[2], x[3], k[4], 6, -145523070)
    x[3] = ii(x[3], x[0], x[1], x[2], k[11], 10, -1120210379)
    x[2] = ii(x[2], x[3], x[0], x[1], k[2], 15, 718787259)
    x[1] = ii(x[1], x[2], x[3], x[0], k[9], 21, -343485551)
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t))
    return add32((a << s) | (a >>> (32 - s)), b)
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | (~d)), a, b, x, s, t)
  }

  function md51(s: number[]): string {
    const n = s.length
    const state = [1732584193, -271733879, -1732584194, 271733878]

    let i = 0
    for (i = 64; i <= s.length; i += 64) {
      const chunk: number[] = []
      for (let j = 0; j < 16; j++) {
        chunk[j] = s[i - 64 + j * 4] | (s[i - 64 + j * 4 + 1] << 8) | (s[i - 64 + j * 4 + 2] << 16) | (s[i - 64 + j * 4 + 3] << 24)
      }
      md5cycle(state, chunk)
    }

    const tail = s.slice(i - 64)
    const tailLen = tail.length
    const tailPadded = new Array(64).fill(0)
    for (let m = 0; m < tailLen; m++) {
      tailPadded[m] = tail[m]
    }
    tailPadded[tailLen] = 0x80

    let bitLen = n * 8
    if (tailLen >= 56) {
      const tempChunk: number[] = []
      for (let j = 0; j < 16; j++) {
        tempChunk[j] = tailPadded[j * 4] | (tailPadded[j * 4 + 1] << 8) | (tailPadded[j * 4 + 2] << 16) | (tailPadded[j * 4 + 3] << 24)
      }
      md5cycle(state, tempChunk)
      tailPadded.length = 64
      tailPadded.fill(0)
    }

    tailPadded[56] = bitLen & 0xff
    tailPadded[57] = (bitLen >>> 8) & 0xff
    tailPadded[58] = (bitLen >>> 16) & 0xff
    tailPadded[59] = (bitLen >>> 24) & 0xff

    const finalChunk: number[] = []
    for (let j = 0; j < 16; j++) {
      finalChunk[j] = tailPadded[j * 4] | (tailPadded[j * 4 + 1] << 8) | (tailPadded[j * 4 + 2] << 16) | (tailPadded[j * 4 + 3] << 24)
    }
    md5cycle(state, finalChunk)

    return state.map((n) => {
      const h = (n >>> 0).toString(16)
      return '00000000'.slice(0, 8 - h.length) + h
    }).join('')
  }

  function add32(a: number, b: number): number {
    return (a + b) & 0xFFFFFFFF
  }

  const nblk = ((text.length + 8) >> 6) + 1
  const blks: number[] = new Array(nblk * 16).fill(0)

  for (let i = 0; i < text.length; i++) {
    blks[i >> 2] |= text.charCodeAt(i) << ((i % 4) * 8)
  }

  return md51(blks)
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
  const md5Hash = md5(baseString)

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
