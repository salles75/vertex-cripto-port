import { Router, type Request, type Response } from 'express'
import type { NewsService } from '../services/NewsService.js'

const router = Router()

/**
 * GET /api/news
 * Lista notícias do mercado
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const newsService = req.app.get('newsService') as NewsService
    const limit = parseInt(req.query.limit as string) || 10
    const source = req.query.source as string

    let news

    if (source === 'scrape') {
      news = await newsService.scrapeNews()
    } else {
      news = await newsService.getCryptoNews(limit)
    }

    res.json({
      success: true,
      data: news,
      meta: {
        count: news.length,
        source: source || 'api',
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/news/asset/:symbol
 * Notícias relacionadas a um ativo específico
 */
router.get('/asset/:symbol', async (req: Request, res: Response) => {
  try {
    const newsService = req.app.get('newsService') as NewsService
    const { symbol } = req.params

    const news = await newsService.getNewsForAsset(symbol)

    res.json({
      success: true,
      data: news,
      meta: {
        symbol: symbol.toUpperCase(),
        count: news.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news for asset',
    })
  }
})

/**
 * GET /api/news/sentiment
 * Análise de sentimento agregada
 */
router.get('/sentiment', async (req: Request, res: Response) => {
  try {
    const newsService = req.app.get('newsService') as NewsService
    const news = await newsService.getCryptoNews(50)

    const sentimentCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    }

    news.forEach((article) => {
      if (article.sentiment) {
        sentimentCounts[article.sentiment]++
      }
    })

    const total = news.length
    const sentimentScore = total > 0
      ? (sentimentCounts.positive - sentimentCounts.negative) / total
      : 0

    res.json({
      success: true,
      data: {
        counts: sentimentCounts,
        total,
        score: Math.round(sentimentScore * 100) / 100,
        overall: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
    })
  }
})

export { router as newsRoutes }
