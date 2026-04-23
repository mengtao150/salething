import SparkMD5 from 'spark-md5'
import { kdniaoConfig, isKdniaoConfigured } from '@/config/kdniao'

export interface KdniaoTraceItem {
  AcceptTime: string
  AcceptStation: string
  Location?: string
  Action?: string
  Remark?: string
}

interface KdniaoBaseResponse {
  Success: boolean
  Reason?: string
}

interface KdniaoTraceResponse extends KdniaoBaseResponse {
  ShipperCode?: string
  ShipperName?: string
  LogisticCode?: string
  State?: string
  StateEx?: string
  Traces?: KdniaoTraceItem[]
}

export interface KdniaoTraceResult {
  shipperCode: string
  shipperName: string
  logisticCode: string
  stateCode: string
  stateLabel: string
  traces: KdniaoTraceItem[]
  fromCache: boolean
  cachedAt?: string
}

interface KdniaoTraceCacheEntry {
  value: Omit<KdniaoTraceResult, 'fromCache'>
  cachedAt: string
  expiresAt: number
}

const stateLabelMap: Record<string, string> = {
  '0': '暂无轨迹',
  '1': '已揽收',
  '2': '运输中',
  '3': '签收',
  '4': '问题件',
  '5': '派送中',
  '6': '退回',
  '7': '转寄',
  '8': '清关',
  '14': '拒签'
}

const TRACE_CACHE_KEY = 'kdniao_trace_cache'
const TRACE_CACHE_TTL_MS = 30 * 60 * 1000

function buildDataSign(requestData: string) {
  const md5Text = SparkMD5.hash(requestData + kdniaoConfig.apiKey)
  return btoa(md5Text)
}

function getTraceCacheMap(): Record<string, KdniaoTraceCacheEntry> {
  try {
    const raw = localStorage.getItem(TRACE_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, KdniaoTraceCacheEntry>
  } catch {
    return {}
  }
}

function saveTraceCacheMap(cacheMap: Record<string, KdniaoTraceCacheEntry>) {
  try {
    localStorage.setItem(TRACE_CACHE_KEY, JSON.stringify(cacheMap))
  } catch {
    // Ignore quota and serialization failures so lookup still works without cache.
  }
}

function buildTraceCacheKey(logisticCode: string, customerName?: string) {
  return `${logisticCode.trim()}::${customerName?.trim() || ''}`
}

function readTraceCache(logisticCode: string, customerName?: string): KdniaoTraceResult | null {
  const cacheMap = getTraceCacheMap()
  const cacheKey = buildTraceCacheKey(logisticCode, customerName)
  const entry = cacheMap[cacheKey]

  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    delete cacheMap[cacheKey]
    saveTraceCacheMap(cacheMap)
    return null
  }

  return {
    ...entry.value,
    fromCache: true,
    cachedAt: entry.cachedAt
  }
}

function writeTraceCache(logisticCode: string, customerName: string | undefined, value: Omit<KdniaoTraceResult, 'fromCache'>) {
  const cacheMap = getTraceCacheMap()
  const cacheKey = buildTraceCacheKey(logisticCode, customerName)
  const cachedAt = new Date().toISOString()

  cacheMap[cacheKey] = {
    value,
    cachedAt,
    expiresAt: Date.now() + TRACE_CACHE_TTL_MS
  }

  saveTraceCacheMap(cacheMap)
}

async function postKdniaoRequest<T>(requestType: string, requestData: Record<string, unknown>) {
  if (!isKdniaoConfigured()) {
    throw new Error('请先在 src/config/kdniao.ts 中填写 EBusinessID 和 APIKey')
  }

  const requestDataText = JSON.stringify(requestData)
  const formData = new URLSearchParams()
  formData.set('RequestData', requestDataText)
  formData.set('EBusinessID', kdniaoConfig.eBusinessId)
  formData.set('RequestType', requestType)
  formData.set('DataSign', buildDataSign(requestDataText))
  formData.set('DataType', '2')

  const response = await fetch(kdniaoConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: formData.toString()
  })

  if (!response.ok) {
    throw new Error(`快递鸟请求失败：${response.status}`)
  }

  return (await response.json()) as T
}

export async function queryKdniaoTrace(options: {
  logisticCode: string
  customerName?: string
  forceRefresh?: boolean
}) {
  const logisticCode = options.logisticCode.trim()
  const customerName = options.customerName?.trim()

  if (!logisticCode) {
    throw new Error('请输入物流单号')
  }

  if (!options.forceRefresh) {
    const cached = readTraceCache(logisticCode, customerName)
    if (cached) {
      return cached
    }
  }

  const requestData: Record<string, unknown> = {
    LogisticCode: logisticCode
  }

  if (customerName) {
    requestData.CustomerName = customerName
  }

  const result = await postKdniaoRequest<KdniaoTraceResponse>(kdniaoConfig.traceRequestType, requestData)

  if (!result.Success) {
    throw new Error(result.Reason || '物流轨迹查询失败')
  }

  const value = {
    shipperCode: result.ShipperCode || '',
    shipperName: result.ShipperName || result.ShipperCode || '自动识别',
    logisticCode: result.LogisticCode || logisticCode,
    stateCode: result.State || '0',
    stateLabel: stateLabelMap[result.State || '0'] || '未知状态',
    traces: result.Traces || [],
    cachedAt: new Date().toISOString()
  }

  writeTraceCache(logisticCode, customerName, value)

  return {
    ...value,
    fromCache: false
  } satisfies KdniaoTraceResult
}
