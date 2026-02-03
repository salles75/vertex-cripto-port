import { Router, type Request, type Response } from 'express'
import type { PriceService } from '../services/PriceService.js'

const router = Router()

/**
 * GET /api/assets
 * Lista as principais criptomoedas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const limit = parseInt(req.query.limit as string) || 20
    
    const assets = await priceService.getTopCryptos(limit)
    res.json({
      success: true,
      data: assets,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/assets/search
 * Pesquisa criptomoedas
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const query = req.query.q as string
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters',
      })
    }

    const results = await priceService.searchCryptos(query)
    res.json({
      success: true,
      data: results,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Search failed',
    })
  }
})

/**
 * GET /api/assets/:id
 * Detalhes de uma criptomoeda específica
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const { id } = req.params

    const asset = await priceService.getCryptoById(id)
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found',
      })
    }

    res.json({
      success: true,
      data: asset,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset details',
    })
  }
})

/**
 * GET /api/assets/:id/history
 * Histórico de preços para gráficos
 * @param days - Número de dias ou 0 para todo o histórico ("max")
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const { id } = req.params
    const daysParam = req.query.days as string
    
    // 0 ou "max" significa todo o histórico disponível
    const days: number | 'max' = 
      daysParam === '0' || daysParam === 'max' ? 'max' : parseInt(daysParam) || 7

    const history = await priceService.getPriceHistory(id, days)
    
    res.json({
      success: true,
      data: history,
      meta: {
        assetId: id,
        days: days === 'max' ? 'all' : days,
        points: history.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history',
    })
  }
})

/**
 * GET /api/assets/list/available
 * Lista de todas as criptomoedas disponíveis (para autocomplete)
 */
router.get('/list/available', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const list = await priceService.getCryptoList()
    
    res.json({
      success: true,
      data: list,
      count: list.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crypto list',
    })
  }
})

export { router as assetRoutes }
