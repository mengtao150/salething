import type { Item } from '@/types'
import { getCountdown } from './countdown'
import { ElMessage } from 'element-plus'
import { emailJsConfig, isEmailJsConfigured } from '@/config/emailjs'

// 检查需要提醒的商品（剩余时间 < 1天）
export function getUrgentItems(items: Item[]): Item[] {
  return items.filter(item => {
    if (!item.received || item.sold) return false
    const countdown = getCountdown(item.receivedTime)
    if (!countdown) return false
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

// 生成 HTML 格式邮件内容
export function generateHtmlEmail(urgentItems: Item[], expiredItems: Item[]): string {
  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h2 style="color: white; margin: 0; text-align: center;">📦 得物倒卖 - 退货倒计时提醒</h2>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
  `

  if (urgentItems.length > 0) {
    content += `
      <h3 style="color: #e67e22; margin-top: 0;">⏰ 以下商品即将超期（< 1天）</h3>
      <table style="width: 100%; border-collapse: collapse;">
    `
    urgentItems.forEach((item, index) => {
      const countdown = getCountdown(item.receivedTime)
      const bgColor = index % 2 === 0 ? '#fff' : '#f3f4f6'
      content += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <strong>${item.name}</strong> <span style="color: #909399; font-size: 12px;">(${item.platform})</span><br>
            <span style="color: #e67e22; font-weight: bold;">剩余: ${countdown?.hours || 0}小时 ${countdown?.minutes || 0}分钟</span>
          </td>
        </tr>
      `
    })
    content += `</table><br>`
  }

  if (expiredItems.length > 0) {
    content += `
      <h3 style="color: #95a5a6; margin-top: 20px;">⚠️ 以下商品已超期</h3>
      <table style="width: 100%; border-collapse: collapse;">
    `
    expiredItems.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#fff' : '#f3f4f6'
      content += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">
            <strong>${item.name}</strong> <span style="color: #909399; font-size: 12px;">(${item.platform})</span><br>
            <span style="color: #95a5a6;">状态: 已超期</span>
          </td>
        </tr>
      `
    })
    content += `</table>`
  }

  content += `
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 14px;">请及时处理以上商品的退货或卖出。</p>
      <p style="text-align: center;">
        <a href="https://mengtao150.github.io/salething/" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📱 打开得物倒卖记录</a>
      </p>
      </div>
    </div>
  `

  return content
}

// 使用 EmailJS 发送邮件
export async function sendEmailReminder(urgentItems: Item[], expiredItems: Item[], userEmail: string) {
  // 检查是否已配置
  if (!isEmailJsConfigured()) {
    ElMessage.warning('EmailJS 未配置，将打开邮件客户端')
    openMailtoReminder(urgentItems, expiredItems, userEmail)
    return false
  }

  // 动态导入 EmailJS（只在需要时加载）
  try {
    const emailjs = await import('@emailjs/browser')

    // 初始化 EmailJS
    emailjs.default.init(emailJsConfig.publicKey)

    const subject = urgentItems.length > 0 ? '🔔 商品即将超期提醒' : '⚠️ 商品已超期提醒'

    // 发送邮件 - EmailJS 需要使用特定的模板参数
    const response = await emailjs.default.send(
      emailJsConfig.serviceId,
      'template_default', // 使用默认模板或创建自定义模板
      {
        to_email: userEmail,
        to_name: userEmail.split('@')[0],
        subject: subject,
        message: generateHtmlEmail(urgentItems, expiredItems)
      }
    )

    console.log('EmailJS 响应:', response)
    ElMessage.success('✅ 邮件已发送到 ' + userEmail)
    return true
  } catch (error) {
    console.error('邮件发送失败:', error)
    ElMessage.error('❌ 邮件发送失败，将打开邮件客户端')
    // 失败时回退到 mailto
    openMailtoReminder(urgentItems, expiredItems, userEmail)
    return false
  }
}

// 生成纯文本邮件内容（用于 mailto）
function generateEmailContent(urgentItems: Item[], expiredItems: Item[]): { subject: string; body: string } {
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

// 打开邮件客户端（备用方案）
export function openMailtoReminder(urgentItems: Item[], expiredItems: Item[], userEmail: string) {
  const { subject, body } = generateEmailContent(urgentItems, expiredItems)
  const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoLink, '_blank')
}
