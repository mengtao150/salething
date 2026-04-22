import type { Item, ItemStatus } from '@/types'

export const ITEM_STATUS_OPTIONS: Array<{ label: string; value: ItemStatus }> = [
  { label: '待收货', value: 'pending' },
  { label: '入仓', value: 'received' },
  { label: '售出', value: 'sold' },
  { label: '交易成功', value: 'completed' }
]

export function normalizeItemStatus(status?: ItemStatus | null, received?: boolean, sold?: boolean): ItemStatus {
  if (status === 'pending' || status === 'received' || status === 'sold' || status === 'completed') {
    return status
  }

  if (sold) {
    return 'completed'
  }

  if (received) {
    return 'received'
  }

  return 'pending'
}

export function deriveLegacyFlags(status: ItemStatus) {
  return {
    received: status !== 'pending',
    sold: status === 'sold' || status === 'completed'
  }
}

export function getItemStatus(item: Pick<Item, 'status' | 'received' | 'sold'>): ItemStatus {
  return normalizeItemStatus(item.status, item.received, item.sold)
}

export function isItemReceived(item: Pick<Item, 'status' | 'received' | 'sold'>) {
  return getItemStatus(item) !== 'pending'
}

export function isItemSold(item: Pick<Item, 'status' | 'received' | 'sold'>) {
  const status = getItemStatus(item)
  return status === 'sold' || status === 'completed'
}

export function isItemCompleted(item: Pick<Item, 'status' | 'received' | 'sold'>) {
  return getItemStatus(item) === 'completed'
}

export function isCountdownItem(item: Pick<Item, 'status' | 'received' | 'sold'>) {
  return getItemStatus(item) === 'received'
}

export function shouldShowSaleFields(status: ItemStatus) {
  return status === 'sold' || status === 'completed'
}

export function getStatusLabel(status: ItemStatus) {
  return ITEM_STATUS_OPTIONS.find(option => option.value === status)?.label || '待收货'
}
