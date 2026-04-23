import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Item, Platform, RecordStage, Stats } from '@/types'
import { storageApi } from '@/api/storage'
import { calculateProfit } from '@/utils/profit'
import { getItemStatus, isItemSold } from '@/utils/itemStatus'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)

  async function init() {
    loading.value = true
    try {
      items.value = await storageApi.getItems()
    } catch (error) {
      console.error('加载商品失败:', error)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const allItems = computed(() => items.value)

  function getItemsByRecordStage(recordStage: RecordStage): Item[] {
    return items.value.filter(item => item.recordStage === recordStage)
  }

  function getItemsByStatus(status: Item['status']): Item[] {
    return items.value.filter(item => getItemStatus(item) === status)
  }

  function getItemsByPlatform(platform: Platform): Item[] {
    return items.value.filter(item => item.platform === platform)
  }

  function searchItems(keyword: string): Item[] {
    if (!keyword.trim()) return items.value
    const lowerKeyword = keyword.toLowerCase()
    return items.value.filter(item => item.name.toLowerCase().includes(lowerKeyword))
  }

  async function addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date().toISOString()
    const newItem: Item = {
      ...item,
      id: generateId(items.value),
      createdAt: timestamp,
      updatedAt: timestamp
    }

    const success = await storageApi.addItem(newItem)
    if (success) {
      items.value.push(newItem)
    }

    return success
  }

  async function addItems(importItems: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>[]) {
    if (!importItems.length) return true

    const baseTime = Date.now()
    const nextItems: Item[] = []

    importItems.forEach((item, index) => {
      const timestamp = new Date(baseTime + index).toISOString()
      nextItems.push({
        ...item,
        id: generateId([...items.value, ...nextItems]),
        createdAt: timestamp,
        updatedAt: timestamp
      })
    })

    const success = await storageApi.addItems(nextItems)
    if (success) {
      items.value.push(...nextItems)
    }

    return success
  }

  async function updateItem(id: string, updates: Partial<Item>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) {
      return false
    }

    const updatedItem: Item = {
      ...items.value[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const success = await storageApi.updateItem(id, updates)
    if (success) {
      items.value[index] = updatedItem
    }

    return success
  }

  async function deleteItem(id: string) {
    const success = await storageApi.deleteItem(id)
    if (success) {
      items.value = items.value.filter(item => item.id !== id)
    }

    return success
  }

  async function confirmReceive(id: string) {
    const now = new Date().toISOString()
    return updateItem(id, {
      recordStage: 'inventory',
      status: 'received',
      received: true,
      receivedTime: now,
      sold: false,
      actualSellPrice: undefined,
      sellTime: undefined
    })
  }

  async function confirmSell(id: string, sellPrice: number) {
    return updateItem(id, {
      recordStage: 'inventory',
      status: 'sold',
      received: true,
      sold: true,
      actualSellPrice: sellPrice,
      sellTime: new Date().toISOString()
    })
  }

  async function moveProcurementToInventory(
    id: string,
    mode: 'received' | 'sold',
    options?: {
      receivedTime?: string
      shippingFee?: number
      expectedSellPrice?: number
      actualSellPrice?: number
      sellTime?: string
    }
  ) {
    const item = items.value.find(entry => entry.id === id)
    if (!item) {
      return false
    }

    const receivedTime = options?.receivedTime || item.receivedTime || new Date().toISOString()

    if (mode === 'received') {
      return updateItem(id, {
        recordStage: 'inventory',
        status: 'received',
        shippingFee: options?.shippingFee ?? item.shippingFee,
        expectedSellPrice: options?.expectedSellPrice ?? item.expectedSellPrice,
        received: true,
        receivedTime,
        sold: false,
        actualSellPrice: undefined,
        sellTime: undefined
      })
    }

    const sellTime = options?.sellTime || new Date().toISOString()
    const actualSellPrice = options?.actualSellPrice ?? item.expectedSellPrice ?? 0

    return updateItem(id, {
      recordStage: 'inventory',
      status: 'completed',
      shippingFee: options?.shippingFee ?? item.shippingFee,
      expectedSellPrice: options?.expectedSellPrice ?? item.expectedSellPrice,
      received: true,
      receivedTime,
      sold: true,
      actualSellPrice,
      sellTime
    })
  }

  const stats = computed((): Stats => {
    const inventoryItems = items.value.filter(item => item.recordStage !== 'procurement')
    const totalItems = inventoryItems.length
    const pendingItems = inventoryItems.filter(item => getItemStatus(item) === 'pending').length
    const receivedItems = inventoryItems.filter(item => getItemStatus(item) === 'received').length
    const soldItems = inventoryItems.filter(item => isItemSold(item)).length

    let totalCost = 0
    let totalProfit = 0

    inventoryItems.forEach(item => {
      const profit = calculateProfit(item)
      totalCost += profit.totalCost
      if (profit.actualProfit !== undefined) {
        totalProfit += profit.actualProfit
      }
    })

    const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    return {
      totalItems,
      pendingItems,
      receivedItems,
      soldItems,
      totalCost,
      totalProfit,
      profitRate
    }
  })

  function exportData() {
    return JSON.stringify(items.value)
  }

  async function importData(json: string) {
    try {
      const importItems = JSON.parse(json)
      for (const item of importItems) {
        await storageApi.addItem(item)
      }
      await init()
      return true
    } catch {
      return false
    }
  }

  return {
    items,
    allItems,
    loading,
    init,
    getItemsByRecordStage,
    getItemsByStatus,
    getItemsByPlatform,
    searchItems,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    confirmReceive,
    confirmSell,
    moveProcurementToInventory,
    stats,
    exportData,
    importData
  }
})

function generateId(currentItems: Item[]): string {
  if (currentItems.length === 0) {
    return '1'
  }

  const numericIds = currentItems
    .map(item => Number.parseInt(item.id, 10))
    .filter(id => !Number.isNaN(id))

  if (numericIds.length === 0) {
    return '1'
  }

  return String(Math.max(...numericIds) + 1)
}
