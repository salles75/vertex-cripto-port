export interface Asset {
  id: string
  symbol: string
  name: string
  type: 'crypto' | 'stock'
  currentPrice: number
  priceChange24h: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
  marketCap?: number
  image?: string
  lastUpdated: Date | string
}

export interface PortfolioAsset extends Asset {
  quantity: number
  averagePrice: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  source: string
  imageUrl?: string
  publishedAt: Date | string
  relatedAssets: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface PriceHistoryPoint {
  timestamp: Date | string
  price: number
  volume?: number
}

export interface PredictionData {
  symbol: string
  currentPrice: number
  sma7: number
  sma14: number
  sma30: number
  ema7: number
  ema14: number
  rsi?: number
  trend: 'bullish' | 'bearish' | 'neutral'
  support: number
  resistance: number
  prediction: {
    shortTerm: 'up' | 'down' | 'stable'
    confidence: number
  }
}

export interface WebSocketMessage<T = unknown> {
  type: 'price_update' | 'news_update' | 'portfolio_update' | 'error'
  payload: T
  timestamp: Date | string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
  meta?: Record<string, unknown>
}
