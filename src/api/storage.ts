import { supabase } from '@/lib/supabase'
import type { Item } from '@/types'

const TABLE_NAME = 'items'

class StorageAPI {
  // 获取所有物品
  async getItems(): Promise<Item[]> {
    console.log('开始从 Supabase 加载数据...')

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('updated_at', { ascending: false })

    console.log('Supabase 响应:', { data, error })

    if (error) {
      console.error('Supabase 查询错误:', error)
      throw error
    }

    console.log('原始数据条数:', data?.length || 0)
    const transformed = this.transformFromDB(data || [])
    console.log('转换后数据条数:', transformed.length)

    return transformed
  }

  // 添加物品
  async addItem(item: Item): Promise<boolean> {
    const dbItem = this.transformToDB(item)
    const { error } = await supabase.from(TABLE_NAME).insert([dbItem])
    if (error) throw error
    return true
  }

  // 更新物品
  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
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
  }

  // 删除物品
  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)
    if (error) throw error
    return true
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
