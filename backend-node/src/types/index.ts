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
  lastUpdated: Date
}

export interface Portfolio {
  id: string
  userId: string
  assets: PortfolioAsset[]
  totalValue: number
  totalChange24h: number
  createdAt: Date
  updatedAt: Date
}

export interface PortfolioAsset {
  assetId: string
  symbol: string
  name: string
  type: 'crypto' | 'stock'
  quantity: number
  averagePrice: number
  currentPrice: number
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
  publishedAt: Date
  relatedAssets: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface PriceHistoryPoint {
  timestamp: Date
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

export interface WebSocketMessage {
  type: 'price_update' | 'news_update' | 'portfolio_update' | 'error'
  payload: unknown
  timestamp: Date
}

export interface CoinGeckoPrice {
  [key: string]: {
    usd: number
    usd_24h_change: number
    usd_24h_vol: number
    usd_market_cap: number
  }
}

export interface CoinGeckoCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_24h: number
  price_change_percentage_24h: number
  high_24h: number
  low_24h: number
  total_volume: number
  last_updated: string
}
