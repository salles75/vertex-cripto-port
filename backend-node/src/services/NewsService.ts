import axios from 'axios'
import * as cheerio from 'cheerio'
import type { NewsArticle } from '../types/index.js'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class NewsService {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly CACHE_TTL = 300000 // 5 minutos para notícias

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  /**
   * Busca notícias gerais do mercado crypto via scraping do CoinDesk
   */
  async getCryptoNews(limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `crypto_news_${limit}`
    const cached = this.getCached<NewsArticle[]>(cacheKey)
    if (cached) return cached

    try {
      // Utilizando CoinGecko status updates como fonte alternativa
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/status_updates',
        {
          params: {
            category: 'general',
            per_page: limit,
          },
        }
      )

      const news: NewsArticle[] = response.data.status_updates.map(
        (update: {
          id: string
          description: string
          category: string
          created_at: string
          project: { name: string; symbol: string }
        }, index: number) => ({
          id: `news-${index}-${Date.now()}`,
          title: update.description.slice(0, 100) + (update.description.length > 100 ? '...' : ''),
          description: update.description,
          url: '#',
          source: update.project?.name || 'CoinGecko',
          publishedAt: new Date(update.created_at),
          relatedAssets: update.project ? [update.project.symbol.toUpperCase()] : [],
          sentiment: this.analyzeSentiment(update.description),
        })
      )

      this.setCache(cacheKey, news)
      return news
    } catch (error) {
      console.error('Error fetching crypto news:', error)
      // Fallback para notícias mock em caso de erro
      return this.getMockNews()
    }
  }

  /**
   * Scraping de notícias do CryptoNews (backup)
   */
  async scrapeNews(): Promise<NewsArticle[]> {
    const cacheKey = 'scraped_news'
    const cached = this.getCached<NewsArticle[]>(cacheKey)
    if (cached) return cached

    try {
      const response = await axios.get('https://cryptonews.com/news/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AssetManager/1.0)',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)
      const articles: NewsArticle[] = []

      $('.news-item, .article-item').each((index, element) => {
        if (index >= 10) return false

        const $el = $(element)
        const title = $el.find('h3, h4, .title').text().trim()
        const description = $el.find('p, .excerpt').text().trim()
        const url = $el.find('a').attr('href') || '#'
        const image = $el.find('img').attr('src')

        if (title) {
          articles.push({
            id: `scraped-${index}-${Date.now()}`,
            title,
            description: description || title,
            url: url.startsWith('http') ? url : `https://cryptonews.com${url}`,
            source: 'CryptoNews',
            imageUrl: image,
            publishedAt: new Date(),
            relatedAssets: this.extractAssetMentions(title + ' ' + description),
            sentiment: this.analyzeSentiment(title + ' ' + description),
          })
        }
      })

      if (articles.length > 0) {
        this.setCache(cacheKey, articles)
      }

      return articles.length > 0 ? articles : this.getMockNews()
    } catch (error) {
      console.error('Error scraping news:', error)
      return this.getMockNews()
    }
  }

  /**
   * Busca notícias relacionadas a um ativo específico
   */
  async getNewsForAsset(symbol: string): Promise<NewsArticle[]> {
    const allNews = await this.getCryptoNews(50)
    return allNews.filter((article) =>
      article.relatedAssets.includes(symbol.toUpperCase()) ||
      article.title.toLowerCase().includes(symbol.toLowerCase()) ||
      article.description.toLowerCase().includes(symbol.toLowerCase())
    )
  }

  /**
   * Análise de sentimento simplificada
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'surge', 'gain', 'bull', 'rise', 'high', 'growth', 'profit', 'rally',
      'breakthrough', 'success', 'adoption', 'partnership', 'launch', 'upgrade',
      'sobe', 'alta', 'lucro', 'crescimento', 'positivo', 'sucesso'
    ]
    const negativeWords = [
      'crash', 'drop', 'bear', 'fall', 'low', 'loss', 'decline', 'dump',
      'hack', 'scam', 'fraud', 'ban', 'regulation', 'warning', 'risk',
      'cai', 'queda', 'perda', 'negativo', 'risco', 'fraude'
    ]

    const lowerText = text.toLowerCase()
    let score = 0

    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) score++
    })

    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) score--
    })

    if (score > 0) return 'positive'
    if (score < 0) return 'negative'
    return 'neutral'
  }

  /**
   * Extrai menções de ativos do texto
   */
  private extractAssetMentions(text: string): string[] {
    const commonSymbols = [
      'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC',
      'SHIB', 'TRX', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM'
    ]
    
    const upperText = text.toUpperCase()
    return commonSymbols.filter((symbol) => upperText.includes(symbol))
  }

  /**
   * Notícias mock para fallback
   */
  private getMockNews(): NewsArticle[] {
    return [
      {
        id: 'mock-1',
        title: 'Bitcoin mantém tendência de alta com suporte institucional',
        description: 'Grandes investidores institucionais continuam acumulando Bitcoin, impulsionando o preço para novos patamares.',
        url: '#',
        source: 'Market Watch',
        publishedAt: new Date(),
        relatedAssets: ['BTC'],
        sentiment: 'positive',
      },
      {
        id: 'mock-2',
        title: 'Ethereum prepara atualização importante da rede',
        description: 'A próxima atualização promete melhorar a escalabilidade e reduzir taxas de transação na rede Ethereum.',
        url: '#',
        source: 'Crypto Daily',
        publishedAt: new Date(Date.now() - 3600000),
        relatedAssets: ['ETH'],
        sentiment: 'positive',
      },
      {
        id: 'mock-3',
        title: 'Mercado de criptomoedas apresenta volatilidade',
        description: 'Analistas alertam para possíveis correções no curto prazo enquanto o mercado busca nova direção.',
        url: '#',
        source: 'Finance Hub',
        publishedAt: new Date(Date.now() - 7200000),
        relatedAssets: ['BTC', 'ETH'],
        sentiment: 'neutral',
      },
      {
        id: 'mock-4',
        title: 'Solana registra aumento significativo em volume de transações',
        description: 'A blockchain Solana continua atraindo desenvolvedores e projetos DeFi, aumentando sua relevância no mercado.',
        url: '#',
        source: 'DeFi Weekly',
        publishedAt: new Date(Date.now() - 10800000),
        relatedAssets: ['SOL'],
        sentiment: 'positive',
      },
      {
        id: 'mock-5',
        title: 'Reguladores discutem novas diretrizes para o mercado cripto',
        description: 'Autoridades financeiras globais se reúnem para debater framework regulatório para criptomoedas.',
        url: '#',
        source: 'Regulation News',
        publishedAt: new Date(Date.now() - 14400000),
        relatedAssets: [],
        sentiment: 'neutral',
      },
    ]
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}
