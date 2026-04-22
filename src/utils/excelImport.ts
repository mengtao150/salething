import * as XLSX from 'xlsx'
import type { Item, ItemCategory, Platform } from '@/types'

type ImportedItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>

export interface ExcelImportSummary {
  items: ImportedItemInput[]
  warnings: string[]
}

type ExcelRow = Record<string, unknown>

const PLATFORM_ALIASES: Record<string, Platform> = {
  拼多多: '拼多多',
  pdd: '拼多多',
  淘宝: '淘宝',
  tb: '淘宝',
  抖音: '抖音',
  douyin: '抖音',
  京东: '京东',
  jd: '京东',
  唯品会: '唯品会',
  vip: '唯品会',
  快手: '快手',
  kuaishou: '快手'
}

export async function parseExcelFile(file: File): Promise<ExcelImportSummary> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('Excel 文件中没有可读取的工作表')
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: '',
    raw: false
  })

  if (!rows.length) {
    throw new Error('Excel 文件内容为空')
  }

  const warnings: string[] = []
  const items: ImportedItemInput[] = []

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2
    const row = normalizeRow(rawRow)

    if (isEmptyRow(row)) {
      return
    }

    const name = getText(row['名称'])
    if (!name) {
      warnings.push(`第 ${rowNumber} 行缺少“名称”，已跳过`)
      return
    }

    const platform = normalizePlatform(row['购买平台'])
    if (!platform) {
      warnings.push(`第 ${rowNumber} 行的“购买平台”无法识别，已跳过`)
      return
    }

    const buyPrice = getNumber(row['买入价格'])
    if (buyPrice === undefined) {
      warnings.push(`第 ${rowNumber} 行的“买入价格”无效，已跳过`)
      return
    }

    const shippingFee = getNumber(row['邮费']) ?? 0
    const sellPrice = getNumber(row['卖出价格'])
    const profit = getNumber(row['利润'])
    const receivedTime =
      parseDateValue(row['收货时间']) ||
      deriveReceivedTimeFromDeadline(row['七天无理由时间'])

    const derivedSellPrice =
      sellPrice ?? (profit !== undefined ? Number.parseFloat((buyPrice + shippingFee + profit).toFixed(2)) : undefined)

    const sold = derivedSellPrice !== undefined && derivedSellPrice > 0
    const buyTime = receivedTime || new Date().toISOString()
    const category = inferCategory(name)
    const countdownDays = getNumber(row['倒计时天数'])

    if (!receivedTime && row['收货时间']) {
      warnings.push(`第 ${rowNumber} 行的“收货时间”格式无效，已使用当前时间作为买入时间`)
    }

    if (!receivedTime && row['七天无理由时间']) {
      warnings.push(`第 ${rowNumber} 行根据“七天无理由时间”反推收货时间失败`)
    }

    if (row['倒计时天数'] !== '' && row['倒计时天数'] !== undefined && countdownDays === undefined) {
      warnings.push(`第 ${rowNumber} 行的“倒计时天数”不是有效数字，仅作为参考忽略`)
    }

    items.push({
      name,
      category,
      size: getText(row['尺码']),
      sku: getText(row['货号']),
      platform,
      buyPrice,
      buyTime,
      expectedSellPrice: derivedSellPrice,
      shippingFee,
      received: Boolean(receivedTime),
      receivedTime: receivedTime || undefined,
      sold,
      actualSellPrice: sold ? derivedSellPrice : undefined,
      sellTime: sold ? receivedTime || undefined : undefined
    })
  })

  if (!items.length) {
    throw new Error('没有可导入的有效商品，请检查 Excel 字段内容')
  }

  return { items, warnings }
}

function normalizeRow(row: ExcelRow) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [String(key).trim(), value]))
}

function isEmptyRow(row: ExcelRow) {
  return Object.values(row).every(value => !getText(value))
}

function getText(value: unknown) {
  if (value === null || value === undefined) return undefined
  const normalized = String(value).trim()
  return normalized ? normalized : undefined
}

function getNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  const normalized = String(value).replace(/[,\s￥¥元]/g, '')
  const numberValue = Number.parseFloat(normalized)
  if (!Number.isFinite(numberValue)) return undefined
  return Number.parseFloat(numberValue.toFixed(2))
}

function normalizePlatform(value: unknown): Platform | undefined {
  const text = getText(value)
  if (!text) return undefined
  return PLATFORM_ALIASES[text.toLowerCase()] || PLATFORM_ALIASES[text]
}

function parseDateValue(value: unknown) {
  const text = getText(value)
  if (!text) return undefined

  const normalized = text.replace(/[./]/g, '-')
  const dateOnly = normalized.match(/^\d{4}-\d{2}-\d{2}$/)
  if (dateOnly) {
    return `${normalized}T00:00:00.000Z`
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function deriveReceivedTimeFromDeadline(value: unknown) {
  const deadline = parseDateValue(value)
  if (!deadline) return undefined

  const date = new Date(deadline)
  date.setUTCDate(date.getUTCDate() - 7)
  return date.toISOString()
}

function inferCategory(name: string): ItemCategory {
  if (/(鞋|跑鞋|球鞋|拖鞋|靴)/.test(name)) {
    return '鞋子'
  }

  if (/(书包|背包|双肩包|斜挎包|托特包|包)/.test(name)) {
    return '书包'
  }

  if (/(衣|裤|裙|卫衣|外套|衬衫|T恤|羽绒服)/i.test(name)) {
    return '衣服'
  }

  return '其他'
}
