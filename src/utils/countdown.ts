import type { CountdownResult } from '@/types'

const RETURN_DAYS = 7

export function getCountdown(receivedTime?: string): CountdownResult | null {
  if (!receivedTime) return null

  const received = new Date(receivedTime).getTime()
  const deadline = received + RETURN_DAYS * 24 * 60 * 60 * 1000
  const now = Date.now()
  const diff = deadline - now

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true
    }
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  return {
    days,
    hours,
    minutes,
    isExpired: false
  }
}

export function getCountdownStatus(receivedTime?: string): 'normal' | 'warning' | 'danger' | 'expired' {
  const result = getCountdown(receivedTime)
  if (!result) return 'normal'
  if (result.isExpired) return 'expired'
  if (result.days < 1) return 'danger'
  if (result.days < 3) return 'warning'
  return 'normal'
}

export function formatCountdown(countdown: CountdownResult): string {
  if (countdown.isExpired) return '已超期'
  if (countdown.days > 0) return `剩 ${countdown.days} 天 ${countdown.hours} 小时`
  if (countdown.hours > 0) return `剩 ${countdown.hours} 小时 ${countdown.minutes} 分钟`
  return `剩 ${countdown.minutes} 分钟`
}
