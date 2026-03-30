// Supabase Edge Function - 发送邮件提醒
// 使用 Resend 发送邮件（https://resend.com）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ReminderItem {
  name: string
  platform: string
  buyPrice: number
  receivedTime: string
  remainingHours: number
  isExpired: boolean
}

Deno.serve(serve(async (req) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { items, userEmail } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response('No items to remind', { status: 400 })
    }

    // 这里集成 Resend API 发送邮件
    // 你需要在 Supabase Edge Functions secrets 中设置 RESEND_API_KEY
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response('RESEND_API_KEY not configured', { status: 500 })
    }

    // 构建邮件内容
    const urgentItems = items.filter((i: ReminderItem) => !i.isExpired)
    const expiredItems = items.filter((i: ReminderItem) => i.isExpired)

    let emailContent = '<h2>📦 得物倒卖 - 退货倒计时提醒</h2>'

    if (urgentItems.length > 0) {
      emailContent += '<h3>⏰ 以下商品即将超期（< 1天）</h3><ul>'
      urgentItems.forEach((item: ReminderItem) => {
        emailContent += `
          <li>
            <strong>${item.name}</strong> (${item.platform})<br>
            买入价: ¥${item.buyPrice}<br>
            剩余时间: ${item.remainingHours} 小时
          </li>`
      })
      emailContent += '</ul>'
    }

    if (expiredItems.length > 0) {
      emailContent += '<h3>⚠️ 以下商品已超期</h3><ul>'
      expiredItems.forEach((item: ReminderItem) => {
        emailContent += `
          <li>
            <strong>${item.name}</strong> (${item.platform})<br>
            买入价: ¥${item.buyPrice}<br>
            状态: 已超期
          </li>`
      })
      emailContent += '</ul>'
    }

    emailContent += `
      <hr>
      <p><small>请及时处理以上商品的退货或卖出。</small></p>
      <p><a href="https://mengtao150.github.io/salething/">📱 打开得物倒卖记录</a></p>
    `

    // 发送邮件
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '得物倒卖 <noreply@你的域名.com>',
        to: userEmail,
        subject: urgentItems.length > 0 ? '🔔 商品即将超期提醒' : '⚠️ 商品已超期提醒',
        html: emailContent
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error('Resend API error:', error)
      return new Response(`Failed to send email: ${error}`, { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}))
