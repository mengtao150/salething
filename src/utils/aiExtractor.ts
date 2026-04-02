// 智谱 GLM-5 AI 字段提取工具
import { glmConfig } from '@/config/glm'
import type { Platform } from '@/types'

export interface ExtractedItemData {
  name: string
  platform: Platform
  buyPrice: number
  expectedSellPrice?: number
  shippingFee?: number
}

// AI 提示词
const EXTRACTION_PROMPT = `你是一个商品信息提取助手。请从以下文本中提取商品信息，返回 JSON 格式。

要求：
1. platform 必须是以下之一：拼多多、淘宝、抖音、京东、唯品会、快手
2. 价格保留两位小数
3. 如果文本中没有提到某个字段，该字段设为 null

返回格式（必须是纯 JSON，不要有其他文字）：
{
  "name": "商品名称",
  "platform": "平台名称",
  "buyPrice": 价格数字,
  "expectedSellPrice": 预计卖价或null,
  "shippingFee": 快递费或null
}`

// 从语音文本中提取商品信息
export async function extractItemFromVoice(text: string): Promise<ExtractedItemData | null> {
  if (!glmConfig.apiKey) {
    throw new Error('GLM API Key 未配置')
  }

  try {
    const response = await fetch(`${glmConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${glmConfig.apiKey}`
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
        temperature: 0.3,
        response_format: { type: "json_object" }
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

    // 解析 JSON
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      throw new Error('AI 返回格式错误，无法解析 JSON')
    }

    // 验证必填字段
    if (!parsed.name || !parsed.platform || parsed.buyPrice === undefined) {
      throw new Error('AI 提取信息不完整，请重试或手动填写')
    }

    // 验证平台名称
    const validPlatforms: Platform[] = ['拼多多', '淘宝', '抖音', '京东', '唯品会', '快手']
    if (!validPlatforms.includes(parsed.platform)) {
      throw new Error(`平台名称无效: ${parsed.platform}`)
    }

    // 构造返回数据
    const result: ExtractedItemData = {
      name: parsed.name,
      platform: parsed.platform,
      buyPrice: parseFloat(parsed.buyPrice)
    }

    if (parsed.expectedSellPrice !== null && parsed.expectedSellPrice !== undefined) {
      result.expectedSellPrice = parseFloat(parsed.expectedSellPrice)
    }

    if (parsed.shippingFee !== null && parsed.shippingFee !== undefined) {
      result.shippingFee = parseFloat(parsed.shippingFee)
    }

    return result
  } catch (error: any) {
    console.error('AI 提取失败:', error)
    throw error
  }
}
