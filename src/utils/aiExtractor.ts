import { glmConfig } from '@/config/glm'
import type { Platform } from '@/types'

export interface ExtractedItemData {
  name?: string
  platform?: Platform
  buyPrice?: number
  receivedTime?: string
  expectedSellPrice?: number
  shippingFee?: number
  missingFields: string[]
}

const VALID_PLATFORMS: Platform[] = ['拼多多', '淘宝', '抖音', '京东', '唯品会', '快手']

const EXTRACTION_PROMPT = `你是一个商品信息提取助手。请从用户语音转写文本中尽量提取商品字段，并只返回 JSON。

要求：
1. 优先提取以下 6 个字段：name、platform、buyPrice、receivedTime、expectedSellPrice、shippingFee。
2. 如果某个字段无法确定，就返回 null，不要编造。
3. platform 只能是：拼多多、淘宝、抖音、京东、唯品会、快手。
4. 价格字段返回数字，保留两位小数即可。
5. receivedTime 如果能识别，请返回字符串，格式优先使用 YYYY-MM-DD HH:mm；如果只能识别日期，也可返回 YYYY-MM-DD。
6. 如果文本里出现“昨天、今天、前天、上午、下午、晚上”等时间描述，请结合当前上下文尽量换算成具体时间字符串；实在无法确定再返回 null。
7. 只输出 JSON，不要输出解释。

返回格式：
{
  "name": "商品名称或null",
  "platform": "平台名称或null",
  "buyPrice": 数字或null,
  "receivedTime": "YYYY-MM-DD HH:mm、YYYY-MM-DD 或 null",
  "expectedSellPrice": 数字或null,
  "shippingFee": 数字或null
}`

export async function extractItemFromVoice(text: string): Promise<ExtractedItemData> {
  if (!glmConfig.apiKey) {
    throw new Error('GLM API Key 未配置')
  }

  try {
    const response = await fetch(`${glmConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${glmConfig.apiKey}`
      },
      body: JSON.stringify({
        model: glmConfig.model,
        messages: [
          {
            role: 'system',
            content: EXTRACTION_PROMPT
          },
          {
            role: 'user',
            content: `文本：${text}`
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`GLM API 错误: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI 返回内容为空')
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('AI 返回格式错误，无法解析 JSON')
    }

    const result: ExtractedItemData = {
      missingFields: []
    }

    const name = normalizeText(parsed.name)
    if (name) {
      result.name = name
    } else {
      result.missingFields.push('商品名称')
    }

    const platform = normalizePlatform(parsed.platform)
    if (platform) {
      result.platform = platform
    } else {
      result.missingFields.push('购买平台')
    }

    const buyPrice = normalizeNumber(parsed.buyPrice)
    if (buyPrice !== undefined) {
      result.buyPrice = buyPrice
    } else {
      result.missingFields.push('买入价格')
    }

    const receivedTime = normalizeDateTime(parsed.receivedTime)
    if (receivedTime) {
      result.receivedTime = receivedTime
    } else {
      result.missingFields.push('收货时间')
    }

    const expectedSellPrice = normalizeNumber(parsed.expectedSellPrice)
    if (expectedSellPrice !== undefined) {
      result.expectedSellPrice = expectedSellPrice
    } else {
      result.missingFields.push('预计卖价')
    }

    const shippingFee = normalizeNumber(parsed.shippingFee)
    if (shippingFee !== undefined) {
      result.shippingFee = shippingFee
    } else {
      result.missingFields.push('快递费用')
    }

    return result
  } catch (error) {
    console.error('AI 提取失败:', error)
    throw error
  }
}

function normalizeText(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized ? normalized : undefined
}

function normalizePlatform(value: unknown): Platform | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim() as Platform
  return VALID_PLATFORMS.includes(normalized) ? normalized : undefined
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const numberValue = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(numberValue)) {
    return undefined
  }

  return Number.parseFloat(numberValue.toFixed(2))
}

function normalizeDateTime(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  const isoDate = new Date(normalized)
  if (!Number.isNaN(isoDate.getTime())) {
    const year = isoDate.getFullYear()
    const month = `${isoDate.getMonth() + 1}`.padStart(2, '0')
    const day = `${isoDate.getDate()}`.padStart(2, '0')
    const hours = `${isoDate.getHours()}`.padStart(2, '0')
    const minutes = `${isoDate.getMinutes()}`.padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const dateOnlyMatch = normalized.match(/^\d{4}-\d{2}-\d{2}$/)
  if (dateOnlyMatch) {
    return `${normalized} 00:00`
  }

  const dateTimeMatch = normalized.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/)
  if (dateTimeMatch) {
    return normalized.replace(/\s+/, ' ')
  }

  return undefined
}
