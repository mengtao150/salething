import type { Item, ProfitResult } from '@/types'
import { isItemSold } from './itemStatus'

export function calculateProfit(item: Item): ProfitResult {
  const shippingFee = item.shippingFee || 0
  const totalCost = item.buyPrice + shippingFee

  let expectedProfit = 0
  if (item.expectedSellPrice) {
    expectedProfit = item.expectedSellPrice - totalCost
  }

  let actualProfit: number | undefined
  if (isItemSold(item) && item.actualSellPrice !== undefined) {
    actualProfit = item.actualSellPrice - totalCost
  }

  let profitRate: number | undefined
  if (isItemSold(item) && actualProfit !== undefined) {
    profitRate = totalCost > 0 ? (actualProfit / totalCost) * 100 : 0
  } else if (item.expectedSellPrice) {
    profitRate = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0
  }

  return {
    totalCost,
    expectedProfit,
    actualProfit,
    profitRate
  }
}

export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function formatProfitRate(rate: number): string {
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}
