import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item, Platform, ItemStatus, Stats } from '@/types'
import { storageApi } from '@/api/storage'
import { calculateProfit } from '@/utils/profit'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)

  // 初始化：从存储加载数据
  async function init() {
    loading.value = true
    try {
      items.value = await storageApi.getItems()
      console.log('加载商品数量:', items.value.length)
    } catch (error) {
      console.error('加载商品失败:', error)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取所有物品
  const allItems = computed(() => items.value)

  // 按状态筛选
  function getItemsByStatus(status: ItemStatus): Item[] {
    switch (status) {
      case 'pending':
        return items.value.filter(item => !item.received)
      case 'received':
        return items.value.filter(item => item.received && !item.sold)
      case 'sold':
        return items.value.filter(item => item.sold)
      default:
        return items.value
    }
  }

  // 按平台筛选
  function getItemsByPlatform(platform: Platform): Item[] {
    return items.value.filter(item => item.platform === platform)
  }

  // 搜索物品
  function searchItems(keyword: string): Item[] {
    if (!keyword.trim()) return items.value
    const lowerKeyword = keyword.toLowerCase()
    return items.value.filter(item =>
      item.name.toLowerCase().includes(lowerKeyword)
    )
  }

  // 添加物品
  async function addItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: Item = {
      ...item,
      id: generateId(items.value),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const success = await storageApi.addItem(newItem)
    if (success) {
      items.value.push(newItem)
    }
    return success
  }

  // 更新物品
  async function updateItem(id: string, updates: Partial<Item>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const updatedItem = {
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
    return false
  }

  // 删除物品
  async function deleteItem(id: string) {
    const success = await storageApi.deleteItem(id)
    if (success) {
      items.value = items.value.filter(item => item.id !== id)
    }
    return success
  }

  // 确认收货
  async function confirmReceive(id: string) {
    return await updateItem(id, {
      received: true,
      receivedTime: new Date().toISOString()
    })
  }

  // 确认卖出
  async function confirmSell(id: string, sellPrice: number) {
    return await updateItem(id, {
      sold: true,
      actualSellPrice: sellPrice,
      sellTime: new Date().toISOString()
    })
  }

  // 统计数据
  const stats = computed((): Stats => {
    const totalItems = items.value.length
    const pendingItems = items.value.filter(i => !i.received).length
    const receivedItems = items.value.filter(i => i.received && !i.sold).length
    const soldItems = items.value.filter(i => i.sold).length

    let totalCost = 0
    let totalProfit = 0

    items.value.forEach(item => {
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

  // 导出数据
  function exportData() {
    return JSON.stringify(items.value)
  }

  // 导入数据
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
    getItemsByStatus,
    getItemsByPlatform,
    searchItems,
    addItem,
    updateItem,
    deleteItem,
    confirmReceive,
    confirmSell,
    stats,
    exportData,
    importData
  }
})

// 生成顺序ID（从现有数据中找出最大ID+1）
function generateId(currentItems: Item[]): string {
  if (currentItems.length === 0) {
    return '1'
  }

  // 找出所有数字类型的ID
  const numericIds = currentItems
    .map(item => parseInt(item.id))
    .filter(id => !isNaN(id))

  if (numericIds.length === 0) {
    return '1'
  }

  const maxId = Math.max(...numericIds)
  return String(maxId + 1)
}
