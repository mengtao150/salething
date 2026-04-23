import { supabase } from '@/lib/supabase'
import type { Item } from '@/types'
import { deriveLegacyFlags, normalizeItemStatus } from '@/utils/itemStatus'

const TABLE_NAME = 'items'
const STATUS_OVERRIDE_KEY = 'item_status_overrides'
const RECORD_STAGE_OVERRIDE_KEY = 'item_record_stage_overrides'

class StorageAPI {
  private statusColumnSupported: boolean | null = null
  private recordStageColumnSupported: boolean | null = null

  async getItems(): Promise<Item[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    const supportsStatusColumn = await this.ensureStatusColumnSupport()
    const supportsRecordStageColumn = await this.ensureRecordStageColumnSupport()
    const statusOverrides = supportsStatusColumn ? {} : this.getStatusOverrides()
    const recordStageOverrides = supportsRecordStageColumn ? {} : this.getRecordStageOverrides()
    return this.transformFromDB(data || [], statusOverrides, recordStageOverrides)
  }

  async addItem(item: Item): Promise<boolean> {
    const supportsStatusColumn = await this.ensureStatusColumnSupport()
    const supportsRecordStageColumn = await this.ensureRecordStageColumnSupport()
    let { error } = await supabase
      .from(TABLE_NAME)
      .insert([this.transformToDB(item, supportsStatusColumn, supportsRecordStageColumn)])

    if (error && supportsStatusColumn && this.isMissingStatusColumnError(error)) {
      this.statusColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .insert([this.transformToDB(item, false, supportsRecordStageColumn)]))
    }

    if (error && supportsRecordStageColumn && this.isMissingRecordStageColumnError(error)) {
      this.recordStageColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .insert([this.transformToDB(item, this.statusColumnSupported !== false, false)]))
    }

    if (error) throw error

    this.persistStatus(item.id, item.status)
    this.persistRecordStage(item.id, item.recordStage)
    return true
  }

  async addItems(items: Item[]): Promise<boolean> {
    const supportsStatusColumn = await this.ensureStatusColumnSupport()
    const supportsRecordStageColumn = await this.ensureRecordStageColumnSupport()
    let { error } = await supabase
      .from(TABLE_NAME)
      .insert(items.map(item => this.transformToDB(item, supportsStatusColumn, supportsRecordStageColumn)))

    if (error && supportsStatusColumn && this.isMissingStatusColumnError(error)) {
      this.statusColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .insert(items.map(item => this.transformToDB(item, false, supportsRecordStageColumn))))
    }

    if (error && supportsRecordStageColumn && this.isMissingRecordStageColumnError(error)) {
      this.recordStageColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .insert(items.map(item => this.transformToDB(item, this.statusColumnSupported !== false, false))))
    }

    if (error) throw error

    items.forEach(item => {
      this.persistStatus(item.id, item.status)
      this.persistRecordStage(item.id, item.recordStage)
    })
    return true
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<boolean> {
    const supportsStatusColumn = await this.ensureStatusColumnSupport()
    const supportsRecordStageColumn = await this.ensureRecordStageColumnSupport()
    const nextUpdates = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    let { error } = await supabase
      .from(TABLE_NAME)
      .update(this.transformToDB(nextUpdates, supportsStatusColumn, supportsRecordStageColumn))
      .eq('id', id)

    if (error && supportsStatusColumn && this.isMissingStatusColumnError(error)) {
      this.statusColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .update(this.transformToDB(nextUpdates, false, supportsRecordStageColumn))
        .eq('id', id))
    }

    if (error && supportsRecordStageColumn && this.isMissingRecordStageColumnError(error)) {
      this.recordStageColumnSupported = false
      ;({ error } = await supabase
        .from(TABLE_NAME)
        .update(this.transformToDB(nextUpdates, this.statusColumnSupported !== false, false))
        .eq('id', id))
    }

    if (error) throw error

    if (nextUpdates.status) {
      this.persistStatus(id, nextUpdates.status)
    }

    if (nextUpdates.recordStage) {
      this.persistRecordStage(id, nextUpdates.recordStage)
    }

    return true
  }

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id)
    if (error) throw error

    this.removeStatus(id)
    this.removeRecordStage(id)
    return true
  }

  private transformFromDB(data: any[], statusOverrides: Record<string, string>, recordStageOverrides: Record<string, string>): Item[] {
    return data.map(item => {
      const status = normalizeItemStatus(statusOverrides[item.id] as any || item.status, item.received, item.sold)
      const legacyFlags = deriveLegacyFlags(status)

      return {
        id: item.id,
        name: item.name,
        category: item.category || '其他',
        size: item.size,
        sku: item.sku,
        platform: item.platform,
        buyPrice: item.buy_price,
        buyTime: item.buy_time,
        expectedSellPrice: item.expected_sell_price,
        shippingFee: item.shipping_fee,
        recordStage: (recordStageOverrides[item.id] as Item['recordStage']) || item.record_stage || 'inventory',
        status,
        received: legacyFlags.received,
        receivedTime: item.received_time,
        sold: legacyFlags.sold,
        actualSellPrice: item.actual_sell_price,
        sellTime: item.sell_time,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }
    })
  }

  private transformToDB(item: Partial<Item>, includeStatus = true, includeRecordStage = true) {
    const status = normalizeItemStatus(item.status, item.received, item.sold)
    const legacyFlags = deriveLegacyFlags(status)
    const dbItem: Record<string, unknown> = {
      id: item.id,
      name: item.name,
      category: item.category,
      size: item.size,
      sku: item.sku,
      platform: item.platform,
      buy_price: item.buyPrice,
      buy_time: item.buyTime,
      expected_sell_price: item.expectedSellPrice,
      shipping_fee: item.shippingFee,
      received: item.received ?? legacyFlags.received,
      received_time: item.receivedTime,
      sold: item.sold ?? legacyFlags.sold,
      actual_sell_price: item.actualSellPrice,
      sell_time: item.sellTime,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }

    if (includeStatus && item.status) {
      dbItem.status = item.status
    }

    if (includeRecordStage && item.recordStage) {
      dbItem.record_stage = item.recordStage
    }

    return dbItem
  }

  private async ensureStatusColumnSupport() {
    if (this.statusColumnSupported !== null) {
      return this.statusColumnSupported
    }

    const { error } = await supabase.from(TABLE_NAME).select('status').limit(1)
    this.statusColumnSupported = !error
    return this.statusColumnSupported
  }

  private isMissingStatusColumnError(error: any) {
    const message = String(error?.message || error?.details || '')
    return message.toLowerCase().includes('status')
  }

  private async ensureRecordStageColumnSupport() {
    if (this.recordStageColumnSupported !== null) {
      return this.recordStageColumnSupported
    }

    const { error } = await supabase.from(TABLE_NAME).select('record_stage').limit(1)
    this.recordStageColumnSupported = !error
    return this.recordStageColumnSupported
  }

  private isMissingRecordStageColumnError(error: any) {
    const message = String(error?.message || error?.details || '')
    return message.toLowerCase().includes('record_stage')
  }

  private getStatusOverrides() {
    try {
      return JSON.parse(localStorage.getItem(STATUS_OVERRIDE_KEY) || '{}') as Record<string, string>
    } catch {
      return {}
    }
  }

  private persistStatus(id: string, status: Item['status']) {
    if (this.statusColumnSupported) {
      this.removeStatus(id)
      return
    }

    const overrides = this.getStatusOverrides()
    overrides[id] = status
    localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(overrides))
  }

  private getRecordStageOverrides() {
    try {
      return JSON.parse(localStorage.getItem(RECORD_STAGE_OVERRIDE_KEY) || '{}') as Record<string, string>
    } catch {
      return {}
    }
  }

  private persistRecordStage(id: string, recordStage: Item['recordStage']) {
    if (this.recordStageColumnSupported) {
      this.removeRecordStage(id)
      return
    }

    const overrides = this.getRecordStageOverrides()
    overrides[id] = recordStage
    localStorage.setItem(RECORD_STAGE_OVERRIDE_KEY, JSON.stringify(overrides))
  }

  private removeStatus(id: string) {
    const overrides = this.getStatusOverrides()
    if (!(id in overrides)) {
      return
    }

    delete overrides[id]
    localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(overrides))
  }

  private removeRecordStage(id: string) {
    const overrides = this.getRecordStageOverrides()
    if (!(id in overrides)) {
      return
    }

    delete overrides[id]
    localStorage.setItem(RECORD_STAGE_OVERRIDE_KEY, JSON.stringify(overrides))
  }
}

export const storageApi = new StorageAPI()
