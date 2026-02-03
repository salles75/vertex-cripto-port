import { Router, type Request, type Response } from 'express'
import { AnalysisService } from '../services/AnalysisService.js'
import type { PriceService } from '../services/PriceService.js'

const router = Router()
const analysisService = new AnalysisService()

/**
 * GET /api/analysis/:id
 * Análise técnica de um ativo
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const priceService = req.app.get('priceService') as PriceService
    const { id } = req.params
    const days = parseInt(req.query.days as string) || 30

    // Busca histórico de preços
    const history = await priceService.getPriceHistory(id, days)
    const prices = history.map((point) => point.price)

    if (prices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No price data available for analysis',
      })
    }

    // Tenta usar o serviço Python primeiro
    const pythonAvailable = await analysisService.isPythonServiceAvailable()
    
    let prediction
    if (pythonAvailable) {
      const asset = await priceService.getCryptoById(id)
      prediction = await analysisService.getPrediction(
        asset?.symbol || id,
        prices
      )
    }

    // Fallback para análise local se Python não disponível
    if (!prediction) {
      const asset = await priceService.getCryptoById(id)
      prediction = analysisService.generateLocalAnalysis(
        asset?.symbol || id.toUpperCase(),
        prices
      )
    }

    res.json({
      success: true,
      data: prediction,
      meta: {
        assetId: id,
        dataPoints: prices.length,
        source: pythonAvailable ? 'python' : 'local',
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/analysis/custom
 * Análise customizada com dados fornecidos
 */
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const { symbol, prices } = req.body

    if (!symbol || !prices || !Array.isArray(prices)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Required: symbol (string), prices (number[])',
      })
    }

    if (prices.length < 7) {
      return res.status(400).json({
        success: false,
        error: 'At least 7 price points are required for analysis',
      })
    }

    // Tenta Python primeiro
    const pythonAvailable = await analysisService.isPythonServiceAvailable()
    
    let prediction
    if (pythonAvailable) {
      prediction = await analysisService.getPrediction(symbol, prices)
    }

    if (!prediction) {
      prediction = analysisService.generateLocalAnalysis(symbol, prices)
    }

    res.json({
      success: true,
      data: prediction,
      meta: {
        source: pythonAvailable ? 'python' : 'local',
        dataPoints: prices.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
    })
  }
})

/**
 * GET /api/analysis/health
 * Verifica status do serviço de análise
 */
router.get('/service/health', async (_req: Request, res: Response) => {
  try {
    const pythonAvailable = await analysisService.isPythonServiceAvailable()

    res.json({
      success: true,
      data: {
        pythonService: pythonAvailable ? 'available' : 'unavailable',
        localFallback: 'available',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    })
  }
})

export { router as analysisRoutes }
