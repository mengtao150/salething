import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Item } from '@/types'

const STORAGE_KEY = 'salething_items'
const TABLE_NAME = 'items'

class StorageAPI {
  private useSupabase: boolean

  constructor() {
    this.useSupabase = isSupabaseConfigured()
  }

  // 获取所有物品
  async getItems(): Promise<Item[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .order('updated_at', { ascending: false })

        if (error) throw error
        return this.transformFromDB(data || [])
      } catch (error) {
        console.error('Supabase 读取失败，回退到本地存储:', error)
        return this.getLocalItems()
      }
    }
    return this.getLocalItems()
  }

  // 添加物品
  async addItem(item: Item): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const dbItem = this.transformToDB(item)
        const { error } = await supabase.from(TABLE_NAME).insert([dbItem])
        if (error) throw error
        return true
      } catch (error) {
        console.error('Supabase 添加失败，回退到本地存储:', error)
        return this.addLocalItem(item)
      }
    }
    return this.addLocalItem(item)
  }

  // 更新物品
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const dbUpdates = this.transformToDB({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        const { error } = await supabase
          .from(TABLE_NAME)
          .update(dbUpdates)
          .eq('id', id)
        if (error) throw error
        return true
      } catch (error) {
        console.error('Supabase 更新失败，回退到本地存储:', error)
        return this.updateLocalItem(id, updates)
      }
    }
    return this.updateLocalItem(id, updates)
  }

  // 删除物品
  async deleteItem(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)
        if (error) throw error
        return true
      } catch (error) {
        console.error('Supabase 删除失败，回退到本地存储:', error)
        return this.deleteLocalItem(id)
      }
    }
    return this.deleteLocalItem(id)
  }

  // ========== 本地存储方法 ==========

  private getLocalItems(): Item[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取本地数据失败:', error)
      return []
    }
  }

  private saveLocalItems(items: Item[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      return true
    } catch (error) {
      console.error('保存本地数据失败:', error)
      return false
    }
  }

  private addLocalItem(item: Item): boolean {
    const items = this.getLocalItems()
    items.push(item)
    return this.saveLocalItems(items)
  }

  private updateLocalItem(id: string, updates: Partial<Item>): boolean {
    const items = this.getLocalItems()
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return false
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
    return this.saveLocalItems(items)
  }

  private deleteLocalItem(id: string): boolean {
    const items = this.getLocalItems().filter(item => item.id !== id)
    return this.saveLocalItems(items)
  }

  // ========== 数据转换方法 ==========

  // 数据库格式 -> 应用格式
  private transformFromDB(data: any[]): Item[] {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      platform: item.platform,
      buyPrice: item.buy_price,
      buyTime: item.buy_time,
      expectedSellPrice: item.expected_sell_price,
      shippingFee: item.shipping_fee,
      received: item.received,
      receivedTime: item.received_time,
      sold: item.sold,
      actualSellPrice: item.actual_sell_price,
      sellTime: item.sell_time,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  }

  // 应用格式 -> 数据库格式
  private transformToDB(item: Partial<Item>): any {
    return {
      id: item.id,
      name: item.name,
      platform: item.platform,
      buy_price: item.buyPrice,
      buy_time: item.buyTime,
      expected_sell_price: item.expectedSellPrice,
      shipping_fee: item.shippingFee,
      received: item.received,
      received_time: item.receivedTime,
      sold: item.sold,
      actual_sell_price: item.actualSellPrice,
      sell_time: item.sellTime,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }
  }
}

export const storageApi = new StorageAPI()
