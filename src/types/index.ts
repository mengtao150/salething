export type Platform = '拼多多' | '淘宝' | '抖音' | '京东' | '唯品会' | '快手'

export type ItemCategory = '鞋子' | '书包' | '衣服' | '其他'

export type ItemStatus = 'pending' | 'received' | 'sold'

export interface Item {
  id: string
  name: string
  category: ItemCategory
  size?: string
  sku?: string
  platform: Platform
  buyPrice: number
  buyTime: string
  expectedSellPrice?: number
  shippingFee?: number
  received: boolean
  receivedTime?: string
  sold: boolean
  actualSellPrice?: number
  sellTime?: string
  createdAt: string
  updatedAt: string
}

export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  isExpired: boolean
}

export interface ProfitResult {
  totalCost: number
  expectedProfit: number
  actualProfit?: number
  profitRate?: number
}

export interface Stats {
  totalItems: number
  pendingItems: number
  receivedItems: number
  soldItems: number
  totalCost: number
  totalProfit: number
  profitRate: number
}
