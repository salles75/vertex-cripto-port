import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { createLogger, format, transports } from 'winston'

import { assetRoutes } from './routes/assets.js'
import { newsRoutes } from './routes/news.js'
import { analysisRoutes } from './routes/analysis.js'
import { setupWebSocketHandlers } from './websocket/handlers.js'
import { PriceService } from './services/PriceService.js'
import { NewsService } from './services/NewsService.js'

dotenv.config()

// Logger configuration
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`
    })
  ),
  transports: [new transports.Console()],
})

const app = express()
const httpServer = createServer(app)

// Socket.io setup com CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Initialize services
const priceService = new PriceService()
const newsService = new NewsService()

// Make services available to routes
app.set('priceService', priceService)
app.set('newsService', newsService)
app.set('io', io)

// Routes
app.use('/api/assets', assetRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/analysis', analysisRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      priceService: 'active',
      newsService: 'active',
      websocket: 'active',
    }
  })
})

// Setup WebSocket handlers
setupWebSocketHandlers(io, priceService, newsService, logger)

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📊 WebSocket server ready`)
  logger.info(`🔗 Python API: ${process.env.PYTHON_API_URL || 'http://localhost:8000'}`)
})

export { app, io, logger }
