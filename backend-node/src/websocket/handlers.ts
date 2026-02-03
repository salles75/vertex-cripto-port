import type { Server, Socket } from 'socket.io'
import type { Logger } from 'winston'
import type { PriceService } from '../services/PriceService.js'
import type { NewsService } from '../services/NewsService.js'

interface SubscriptionState {
  assets: Set<string>
  news: boolean
}

const clientSubscriptions = new Map<string, SubscriptionState>()

export function setupWebSocketHandlers(
  io: Server,
  priceService: PriceService,
  newsService: NewsService,
  logger: Logger
): void {
  // Intervalo para broadcast de preços
  let priceInterval: NodeJS.Timeout | null = null
  let newsInterval: NodeJS.Timeout | null = null

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`)

    // Inicializa estado de subscrição do cliente
    clientSubscriptions.set(socket.id, {
      assets: new Set(),
      news: false,
    })

    // Handler: Subscribe to asset prices
    socket.on('subscribe:assets', async (assetIds: string[]) => {
      const state = clientSubscriptions.get(socket.id)
      if (!state) return

      assetIds.forEach((id) => state.assets.add(id))
      logger.info(`Client ${socket.id} subscribed to: ${assetIds.join(', ')}`)

      // Envia dados iniciais
      try {
        const assets = await priceService.getTopCryptos(50)
        const filtered = assets.filter((a) => state.assets.has(a.id))
        
        socket.emit('prices:initial', {
          type: 'price_update',
          payload: filtered,
          timestamp: new Date(),
        })
      } catch (error) {
        socket.emit('error', {
          type: 'error',
          message: 'Failed to fetch initial prices',
        })
      }
    })

    // Handler: Unsubscribe from assets
    socket.on('unsubscribe:assets', (assetIds: string[]) => {
      const state = clientSubscriptions.get(socket.id)
      if (!state) return

      assetIds.forEach((id) => state.assets.delete(id))
      logger.info(`Client ${socket.id} unsubscribed from: ${assetIds.join(', ')}`)
    })

    // Handler: Subscribe to news
    socket.on('subscribe:news', async () => {
      const state = clientSubscriptions.get(socket.id)
      if (!state) return

      state.news = true
      logger.info(`Client ${socket.id} subscribed to news`)

      // Envia notícias iniciais
      try {
        const news = await newsService.getCryptoNews(10)
        socket.emit('news:initial', {
          type: 'news_update',
          payload: news,
          timestamp: new Date(),
        })
      } catch (error) {
        socket.emit('error', {
          type: 'error',
          message: 'Failed to fetch initial news',
        })
      }
    })

    // Handler: Unsubscribe from news
    socket.on('unsubscribe:news', () => {
      const state = clientSubscriptions.get(socket.id)
      if (!state) return

      state.news = false
      logger.info(`Client ${socket.id} unsubscribed from news`)
    })

    // Handler: Request specific asset data
    socket.on('request:asset', async (assetId: string) => {
      try {
        const asset = await priceService.getCryptoById(assetId)
        if (asset) {
          socket.emit('asset:data', {
            type: 'price_update',
            payload: asset,
            timestamp: new Date(),
          })
        }
      } catch (error) {
        socket.emit('error', {
          type: 'error',
          message: `Failed to fetch data for ${assetId}`,
        })
      }
    })

    // Handler: Request price history
    socket.on('request:history', async ({ assetId, days }: { assetId: string; days: number }) => {
      try {
        const history = await priceService.getPriceHistory(assetId, days)
        socket.emit('history:data', {
          assetId,
          history,
          timestamp: new Date(),
        })
      } catch (error) {
        socket.emit('error', {
          type: 'error',
          message: `Failed to fetch history for ${assetId}`,
        })
      }
    })

    // Handler: Disconnect
    socket.on('disconnect', () => {
      clientSubscriptions.delete(socket.id)
      logger.info(`Client disconnected: ${socket.id}`)
    })
  })

  // Broadcast de preços a cada 30 segundos
  priceInterval = setInterval(async () => {
    if (io.sockets.sockets.size === 0) return

    try {
      const assets = await priceService.getTopCryptos(50)

      // Envia apenas para clientes com subscrições ativas
      clientSubscriptions.forEach((state, socketId) => {
        if (state.assets.size > 0) {
          const socket = io.sockets.sockets.get(socketId)
          if (socket) {
            const filtered = assets.filter((a) => state.assets.has(a.id))
            if (filtered.length > 0) {
              socket.emit('prices:update', {
                type: 'price_update',
                payload: filtered,
                timestamp: new Date(),
              })
            }
          }
        }
      })
    } catch (error) {
      logger.error('Error broadcasting prices:', error)
    }
  }, 30000)

  // Broadcast de notícias a cada 5 minutos
  newsInterval = setInterval(async () => {
    if (io.sockets.sockets.size === 0) return

    try {
      const news = await newsService.getCryptoNews(5)

      // Envia para clientes inscritos em notícias
      clientSubscriptions.forEach((state, socketId) => {
        if (state.news) {
          const socket = io.sockets.sockets.get(socketId)
          if (socket) {
            socket.emit('news:update', {
              type: 'news_update',
              payload: news,
              timestamp: new Date(),
            })
          }
        }
      })
    } catch (error) {
      logger.error('Error broadcasting news:', error)
    }
  }, 300000)

  // Cleanup ao encerrar servidor
  process.on('SIGTERM', () => {
    if (priceInterval) clearInterval(priceInterval)
    if (newsInterval) clearInterval(newsInterval)
  })
}
