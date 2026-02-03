import { io, Socket } from 'socket.io-client'
import type { Asset, NewsArticle } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

type PriceUpdateHandler = (assets: Asset[]) => void
type NewsUpdateHandler = (news: NewsArticle[]) => void
type ErrorHandler = (error: { message: string }) => void

class SocketClient {
  private socket: Socket | null = null
  private priceHandlers: Set<PriceUpdateHandler> = new Set()
  private newsHandlers: Set<NewsUpdateHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()
  private subscribedAssets: Set<string> = new Set()
  private isNewsSubscribed = false

  connect(): void {
    if (this.socket?.connected) return

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      
      // Resubscribe after reconnection
      if (this.subscribedAssets.size > 0) {
        this.socket?.emit('subscribe:assets', Array.from(this.subscribedAssets))
      }
      if (this.isNewsSubscribed) {
        this.socket?.emit('subscribe:news')
      }
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
    })

    // Price updates
    this.socket.on('prices:initial', (data: { payload: Asset[] }) => {
      this.priceHandlers.forEach((handler) => handler(data.payload))
    })

    this.socket.on('prices:update', (data: { payload: Asset[] }) => {
      this.priceHandlers.forEach((handler) => handler(data.payload))
    })

    // News updates
    this.socket.on('news:initial', (data: { payload: NewsArticle[] }) => {
      this.newsHandlers.forEach((handler) => handler(data.payload))
    })

    this.socket.on('news:update', (data: { payload: NewsArticle[] }) => {
      this.newsHandlers.forEach((handler) => handler(data.payload))
    })

    // Errors
    this.socket.on('error', (error: { message: string }) => {
      this.errorHandlers.forEach((handler) => handler(error))
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  subscribeToAssets(assetIds: string[]): void {
    assetIds.forEach((id) => this.subscribedAssets.add(id))
    this.socket?.emit('subscribe:assets', assetIds)
  }

  unsubscribeFromAssets(assetIds: string[]): void {
    assetIds.forEach((id) => this.subscribedAssets.delete(id))
    this.socket?.emit('unsubscribe:assets', assetIds)
  }

  subscribeToNews(): void {
    this.isNewsSubscribed = true
    this.socket?.emit('subscribe:news')
  }

  unsubscribeFromNews(): void {
    this.isNewsSubscribed = false
    this.socket?.emit('unsubscribe:news')
  }

  onPriceUpdate(handler: PriceUpdateHandler): () => void {
    this.priceHandlers.add(handler)
    return () => this.priceHandlers.delete(handler)
  }

  onNewsUpdate(handler: NewsUpdateHandler): () => void {
    this.newsHandlers.add(handler)
    return () => this.newsHandlers.delete(handler)
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

// Singleton instance
export const socketClient = new SocketClient()
