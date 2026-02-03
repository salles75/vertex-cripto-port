import axios from 'axios'
import type { PredictionData } from '../types/index.js'

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'

export class AnalysisService {
  /**
   * Busca análise preditiva do serviço Python
   */
  async getPrediction(
    symbol: string,
    priceHistory: number[]
  ): Promise<PredictionData | null> {
    try {
      const response = await axios.post<PredictionData>(
        `${PYTHON_API_URL}/api/analysis/predict`,
        {
          symbol,
          prices: priceHistory,
        },
        {
          timeout: 10000,
        }
      )

      return response.data
    } catch (error) {
      console.error(`Error getting prediction for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Calcula médias móveis localmente (fallback)
   */
  calculateLocalSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      return prices.reduce((a, b) => a + b, 0) / prices.length
    }

    const recentPrices = prices.slice(-period)
    return recentPrices.reduce((a, b) => a + b, 0) / period
  }

  /**
   * Calcula EMA localmente (fallback)
   */
  calculateLocalEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    if (prices.length === 1) return prices[0]

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }

    return ema
  }

  /**
   * Gera análise local quando o serviço Python não está disponível
   */
  generateLocalAnalysis(
    symbol: string,
    prices: number[]
  ): PredictionData {
    const currentPrice = prices[prices.length - 1] || 0
    const sma7 = this.calculateLocalSMA(prices, 7)
    const sma14 = this.calculateLocalSMA(prices, 14)
    const sma30 = this.calculateLocalSMA(prices, 30)
    const ema7 = this.calculateLocalEMA(prices, 7)
    const ema14 = this.calculateLocalEMA(prices, 14)

    // Determina tendência baseado nas médias
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (currentPrice > sma7 && sma7 > sma14) {
      trend = 'bullish'
    } else if (currentPrice < sma7 && sma7 < sma14) {
      trend = 'bearish'
    }

    // Calcula suporte e resistência simples
    const recentPrices = prices.slice(-30)
    const support = Math.min(...recentPrices) * 0.98
    const resistance = Math.max(...recentPrices) * 1.02

    // Predição simples baseada em tendência
    let shortTerm: 'up' | 'down' | 'stable' = 'stable'
    let confidence = 0.5

    if (trend === 'bullish') {
      shortTerm = 'up'
      confidence = 0.6 + Math.random() * 0.2
    } else if (trend === 'bearish') {
      shortTerm = 'down'
      confidence = 0.6 + Math.random() * 0.2
    }

    return {
      symbol,
      currentPrice,
      sma7,
      sma14,
      sma30,
      ema7,
      ema14,
      trend,
      support,
      resistance,
      prediction: {
        shortTerm,
        confidence: Math.round(confidence * 100) / 100,
      },
    }
  }

  /**
   * Verifica se o serviço Python está disponível
   */
  async isPythonServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/health`, {
        timeout: 3000,
      })
      return response.status === 200
    } catch {
      return false
    }
  }
}
