import type { Item } from '@/types'
import { getCountdown } from './countdown'

// 检查需要提醒的商品（剩余时间 < 1天）
export function getUrgentItems(items: Item[]): Item[] {
  return items.filter(item => {
    // 只检查已收货且未卖出的商品
    if (!item.received || item.sold) return false

    const countdown = getCountdown(item.receivedTime)
    if (!countdown) return false

    // 剩余时间小于1天（24小时）
    return !countdown.isExpired && countdown.days < 1
  })
}

// 检查已超期的商品
export function getExpiredItems(items: Item[]): Item[] {
  return items.filter(item => {
    if (!item.received || item.sold) return false

    const countdown = getCountdown(item.receivedTime)
    if (!countdown) return false

    return countdown.isExpired
  })
}

// 获取提醒消息
export function getReminderMessage(urgentItems: Item[], expiredItems: Item[]): string {
  const messages: string[] = []

  if (urgentItems.length > 0) {
    const names = urgentItems.map(item => item.name).join('、')
    messages.push(`🔔 以下商品即将超期（< 1天）：\n${names}`)
  }

  if (expiredItems.length > 0) {
    const names = expiredItems.map(item => item.name).join('、')
    messages.push(`⚠️ 以下商品已超期：\n${names}`)
  }

  return messages.join('\n\n')
}

// 生成邮件内容
export function generateEmailContent(urgentItems: Item[], expiredItems: Item[]): { subject: string; body: string } {
  let body = '得物倒卖 - 退货倒计时提醒\n\n'

  if (urgentItems.length > 0) {
    body += '【即将超期商品】（< 1天）\n'
    urgentItems.forEach(item => {
      const countdown = getCountdown(item.receivedTime)
      body += `- ${item.name} (${item.platform}) - 剩余: ${countdown?.hours || 0}小时 ${countdown?.minutes || 0}分钟\n`
    })
    body += '\n'
  }

  if (expiredItems.length > 0) {
    body += '【已超期商品】\n'
    expiredItems.forEach(item => {
      body += `- ${item.name} (${item.platform}) - 已超期\n`
    })
    body += '\n'
  }

  body += '请及时处理以上商品。\n访问: https://mengtao150.github.io/salething/'

  return {
    subject: urgentItems.length > 0 ? '🔔 商品即将超期提醒' : '⚠️ 商品已超期提醒',
    body
  }
}

// 打开邮件客户端发送提醒
export function sendEmailReminder(urgentItems: Item[], expiredItems: Item[], userEmail: string) {
  const { subject, body } = generateEmailContent(urgentItems, expiredItems)

  // 使用 mailto 链接打开邮件客户端
  const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, '_blank')
}

