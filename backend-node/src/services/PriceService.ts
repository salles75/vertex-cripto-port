import axios, { AxiosError } from 'axios'
import type { Asset, CoinGeckoCoin, PriceHistoryPoint } from '../types/index.js'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Cache para evitar rate limiting
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Rate limiter queue
interface QueueItem {
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}

export class PriceService {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private requestQueue: QueueItem[] = []
  private isProcessingQueue = false
  private lastRequestTime = 0
  
  // TTLs mais longos para evitar rate limiting
  private readonly CACHE_TTL = {
    list: 5 * 60 * 1000,      // 5 minutos para lista
    asset: 2 * 60 * 1000,     // 2 minutos para ativo individual
    history: 3 * 60 * 1000,   // 3 minutos para histórico
    prices: 60 * 1000,        // 1 minuto para preços
  }
  
  // Intervalo mínimo entre requisições (API gratuita: ~10-30 req/min)
  private readonly REQUEST_INTERVAL = 2000 // 2 segundos entre requisições

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  // Rate-limited request queue
  private async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        execute: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return
    
    this.isProcessingQueue = true
    
    while (this.requestQueue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime
      if (timeSinceLastRequest < this.REQUEST_INTERVAL) {
        await this.sleep(this.REQUEST_INTERVAL - timeSinceLastRequest)
      }
      
      const item = this.requestQueue.shift()!
      this.lastRequestTime = Date.now()
      
      try {
        const result = await this.executeWithRetry(item.execute)
        item.resolve(result)
      } catch (error) {
        item.reject(error)
      }
    }
    
    this.isProcessingQueue = false
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: unknown
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (error instanceof AxiosError) {
          // Rate limited - espera tempo indicado pelo header
          if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10)
            console.log(`Rate limited. Waiting ${retryAfter}s before retry...`)
            await this.sleep(retryAfter * 1000)
            continue
          }
          
          // Erro 5xx - retry com backoff
          if (error.response?.status && error.response.status >= 500) {
            const delay = baseDelay * Math.pow(2, attempt)
            console.log(`Server error ${error.response.status}. Retrying in ${delay}ms...`)
            await this.sleep(delay)
            continue
          }
        }
        
        // Outros erros - não retry
        throw error
      }
    }
    
    throw lastError
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Busca lista das principais criptomoedas
   */
  async getTopCryptos(limit: number = 20): Promise<Asset[]> {
    const cacheKey = `top_cryptos_${limit}`
    const cached = this.getCached<Asset[]>(cacheKey)
    if (cached) {
      console.log(`[Cache HIT] ${cacheKey}`)
      return cached
    }

    try {
      const assets = await this.queueRequest(async () => {
        console.log(`[API] Fetching top ${limit} cryptos...`)
        const response = await axios.get<CoinGeckoCoin[]>(`${COINGECKO_API}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: Math.min(limit, 100), // CoinGecko max 250
            page: 1,
            sparkline: false,
          },
          timeout: 10000,
        })

        return response.data.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto' as const,
          currentPrice: coin.current_price,
          priceChange24h: coin.price_change_24h,
          priceChangePercent24h: coin.price_change_percentage_24h,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          volume24h: coin.total_volume,
          marketCap: coin.market_cap,
          image: coin.image,
          lastUpdated: new Date(coin.last_updated),
        }))
      })

      this.setCache(cacheKey, assets, this.CACHE_TTL.list)
      return assets
    } catch (error) {
      console.error('Error fetching top cryptos:', error)
      
      // Tenta retornar cache expirado em caso de falha
      const staleCache = this.cache.get(cacheKey)
      if (staleCache) {
        console.log('[Fallback] Using stale cache for top cryptos')
        return staleCache.data as Asset[]
      }
      
      throw new Error('Failed to fetch cryptocurrency data')
    }
  }

  /**
   * Busca dados de uma criptomoeda específica
   */
  async getCryptoById(coinId: string): Promise<Asset | null> {
    const cacheKey = `crypto_${coinId}`
    const cached = this.getCached<Asset>(cacheKey)
    if (cached) return cached

    try {
      const asset = await this.queueRequest(async () => {
        console.log(`[API] Fetching crypto ${coinId}...`)
        const response = await axios.get(`${COINGECKO_API}/coins/${coinId}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
          },
          timeout: 10000,
        })

        const data = response.data
        return {
          id: data.id,
          symbol: data.symbol.toUpperCase(),
          name: data.name,
          type: 'crypto' as const,
          currentPrice: data.market_data.current_price.usd,
          priceChange24h: data.market_data.price_change_24h,
          priceChangePercent24h: data.market_data.price_change_percentage_24h,
          high24h: data.market_data.high_24h.usd,
          low24h: data.market_data.low_24h.usd,
          volume24h: data.market_data.total_volume.usd,
          marketCap: data.market_data.market_cap.usd,
          image: data.image?.large,
          lastUpdated: new Date(),
        }
      })

      this.setCache(cacheKey, asset, this.CACHE_TTL.asset)
      return asset
    } catch (error) {
      console.error(`Error fetching crypto ${coinId}:`, error)
      
      // Tenta retornar cache expirado
      const staleCache = this.cache.get(cacheKey)
      if (staleCache) return staleCache.data as Asset
      
      return null
    }
  }

  /**
   * Busca preços de múltiplas criptomoedas
   */
  async getPrices(coinIds: string[]): Promise<Map<string, number>> {
    const cacheKey = `prices_${coinIds.sort().join(',')}`
    const cached = this.getCached<Map<string, number>>(cacheKey)
    if (cached) return cached

    try {
      const prices = await this.queueRequest(async () => {
        console.log(`[API] Fetching prices for ${coinIds.length} coins...`)
        const response = await axios.get(`${COINGECKO_API}/simple/price`, {
          params: {
            ids: coinIds.join(','),
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
          timeout: 10000,
        })

        const priceMap = new Map<string, number>()
        for (const [id, data] of Object.entries(response.data)) {
          priceMap.set(id, (data as { usd: number }).usd)
        }
        return priceMap
      })

      this.setCache(cacheKey, prices, this.CACHE_TTL.prices)
      return prices
    } catch (error) {
      console.error('Error fetching prices:', error)
      
      const staleCache = this.cache.get(cacheKey)
      if (staleCache) return staleCache.data as Map<string, number>
      
      throw new Error('Failed to fetch prices')
    }
  }

  /**
   * Busca histórico de preços para gráficos
   * @param days - Número de dias ou 'max' para todo o histórico
   * Nota: API CoinGecko gratuita limita a 365 dias. 'max' usa 365 dias.
   */
  async getPriceHistory(
    coinId: string,
    days: number | 'max' = 7
  ): Promise<PriceHistoryPoint[]> {
    // API gratuita limita a 365 dias. 'max' usa 365.
    const actualDays = days === 'max' ? 365 : Math.min(days, 365)
    const cacheKey = `history_${coinId}_${actualDays}`
    
    const cached = this.getCached<PriceHistoryPoint[]>(cacheKey)
    if (cached) {
      console.log(`[Cache HIT] ${cacheKey} (${cached.length} points)`)
      return cached
    }

    try {
      const history = await this.queueRequest(async () => {
        console.log(`[API] Fetching ${actualDays} days history for ${coinId}...`)
        const response = await axios.get(
          `${COINGECKO_API}/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'usd',
              days: actualDays,
            },
            timeout: 15000,
          }
        )

        const rawHistory: PriceHistoryPoint[] = response.data.prices.map(
          ([timestamp, price]: [number, number], index: number) => ({
            timestamp: new Date(timestamp),
            price,
            volume: response.data.total_volumes?.[index]?.[1],
          })
        )

        // Otimiza dados para exibição (máx ~300 pontos no gráfico)
        return this.optimizeHistoryData(rawHistory, 300)
      })

      // Cache mais longo para períodos maiores
      const ttl = actualDays >= 365 ? 10 * 60 * 1000 : this.CACHE_TTL.history
      this.setCache(cacheKey, history, ttl)
      return history
    } catch (error) {
      console.error(`Error fetching price history for ${coinId}:`, error)
      
      // Tenta retornar cache expirado
      const staleCache = this.cache.get(cacheKey)
      if (staleCache) {
        console.log('[Fallback] Using stale cache for price history')
        return staleCache.data as PriceHistoryPoint[]
      }
      
      // Se não tiver cache, tenta um período menor
      if (actualDays > 30) {
        console.log(`[Fallback] Trying 30-day history instead of ${actualDays}`)
        return this.getPriceHistory(coinId, 30)
      }
      
      if (actualDays > 7) {
        console.log(`[Fallback] Trying 7-day history instead of ${actualDays}`)
        return this.getPriceHistory(coinId, 7)
      }
      
      throw new Error('Failed to fetch price history')
    }
  }

  /**
   * Otimiza dados de histórico para exibição
   * Reduz número de pontos mantendo representatividade
   */
  private optimizeHistoryData(
    data: PriceHistoryPoint[],
    maxPoints: number
  ): PriceHistoryPoint[] {
    if (data.length <= maxPoints) return data

    // Usa amostragem para reduzir pontos
    const step = Math.ceil(data.length / maxPoints)
    const optimized: PriceHistoryPoint[] = []

    for (let i = 0; i < data.length; i += step) {
      // Pega pontos em intervalos regulares
      optimized.push(data[i])
    }

    // Garante que o último ponto está incluído
    if (optimized[optimized.length - 1] !== data[data.length - 1]) {
      optimized.push(data[data.length - 1])
    }

    return optimized
  }

  /**
   * Busca criptomoedas por termo de pesquisa
   */
  async searchCryptos(query: string): Promise<Asset[]> {
    const cacheKey = `search_${query.toLowerCase()}`
    const cached = this.getCached<Asset[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await this.queueRequest(async () => {
        console.log(`[API] Searching cryptos: ${query}`)
        return axios.get(`${COINGECKO_API}/search`, {
          params: { query },
          timeout: 10000,
        })
      })

      const coinIds = (response as { data: { coins: { id: string }[] } }).data.coins
        .slice(0, 10)
        .map((c: { id: string }) => c.id)

      if (coinIds.length === 0) return []

      // Busca dados completos dos resultados
      const topCryptos = await this.getTopCryptos(100)
      const results = topCryptos.filter((asset) => coinIds.includes(asset.id))
      
      this.setCache(cacheKey, results, this.CACHE_TTL.asset)
      return results
    } catch (error) {
      console.error('Error searching cryptos:', error)
      return []
    }
  }

  /**
   * Lista de criptomoedas disponíveis (para autocomplete)
   */
  async getCryptoList(): Promise<{ id: string; symbol: string; name: string }[]> {
    const cacheKey = 'crypto_list'
    const cached = this.getCached<{ id: string; symbol: string; name: string }[]>(cacheKey)
    if (cached) return cached

    try {
      const list = await this.queueRequest(async () => {
        console.log('[API] Fetching crypto list...')
        const response = await axios.get(`${COINGECKO_API}/coins/list`, {
          timeout: 10000,
        })
        return response.data.slice(0, 500) // Limita para performance
      })

      this.setCache(cacheKey, list, this.CACHE_TTL.list)
      return list
    } catch (error) {
      console.error('Error fetching crypto list:', error)
      return []
    }
  }

  /**
   * Retorna estatísticas do cache (para debug)
   */
  getCacheStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}
