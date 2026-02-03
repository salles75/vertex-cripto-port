import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(decimals)}T`
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`
  }
  return value.toFixed(decimals)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins}min atrás`
  if (diffHours < 24) return `${diffHours}h atrás`
  if (diffDays < 7) return `${diffDays}d atrás`
  
  return formatDate(d)
}

export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-price-up'
  if (change < 0) return 'text-price-down'
  return 'text-price-neutral'
}

export function getPriceChangeBg(change: number): string {
  if (change > 0) return 'bg-price-up/15'
  if (change < 0) return 'bg-price-down/15'
  return 'bg-price-neutral/15'
}

export function getTrendIcon(trend: 'bullish' | 'bearish' | 'neutral'): string {
  switch (trend) {
    case 'bullish':
      return '📈'
    case 'bearish':
      return '📉'
    default:
      return '➡️'
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
