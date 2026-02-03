import type { Asset, NewsArticle, PriceHistoryPoint, PredictionData, ApiResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Assets
  async getAssets(limit: number = 20): Promise<Asset[]> {
    const response = await this.fetch<ApiResponse<Asset[]>>(`/api/assets?limit=${limit}`)
    return response.data
  }

  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const response = await this.fetch<ApiResponse<Asset>>(`/api/assets/${id}`)
      return response.data
    } catch {
      return null
    }
  }

  async searchAssets(query: string): Promise<Asset[]> {
    const response = await this.fetch<ApiResponse<Asset[]>>(`/api/assets/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  /**
   * Busca histórico de preços
   * @param assetId - ID do ativo
   * @param days - Número de dias ou 0/'max' para todo o histórico
   */
  async getPriceHistory(assetId: string, days: number | 'max' = 7): Promise<PriceHistoryPoint[]> {
    const daysParam = days === 'max' || days === 0 ? 'max' : days
    const response = await this.fetch<ApiResponse<PriceHistoryPoint[]>>(
      `/api/assets/${assetId}/history?days=${daysParam}`
    )
    return response.data
  }

  // News
  async getNews(limit: number = 10): Promise<NewsArticle[]> {
    const response = await this.fetch<ApiResponse<NewsArticle[]>>(`/api/news?limit=${limit}`)
    return response.data
  }

  async getNewsForAsset(symbol: string): Promise<NewsArticle[]> {
    const response = await this.fetch<ApiResponse<NewsArticle[]>>(`/api/news/asset/${symbol}`)
    return response.data
  }

  async getSentimentAnalysis(): Promise<{
    counts: { positive: number; negative: number; neutral: number }
    score: number
    overall: string
  }> {
    const response = await this.fetch<ApiResponse<{
      counts: { positive: number; negative: number; neutral: number }
      score: number
      overall: string
    }>>('/api/news/sentiment')
    return response.data
  }

  // Analysis
  async getAnalysis(assetId: string): Promise<PredictionData | null> {
    try {
      const response = await this.fetch<ApiResponse<PredictionData>>(`/api/analysis/${assetId}`)
      return response.data
    } catch {
      return null
    }
  }

  // Health
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch<{ status: string }>('/health')
      return response.status === 'ok'
    } catch {
      return false
    }
  }
}

export const api = new ApiClient(API_URL)
