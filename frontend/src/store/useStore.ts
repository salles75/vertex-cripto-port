import { create } from 'zustand'
import type { Asset, NewsArticle, PortfolioAsset } from '@/types'

interface AppState {
  // Assets
  assets: Asset[]
  setAssets: (assets: Asset[]) => void
  updateAsset: (asset: Asset) => void

  // Portfolio
  portfolio: PortfolioAsset[]
  addToPortfolio: (asset: Asset, quantity: number, averagePrice: number) => void
  removeFromPortfolio: (assetId: string) => void
  updatePortfolioQuantity: (assetId: string, quantity: number) => void

  // News
  news: NewsArticle[]
  setNews: (news: NewsArticle[]) => void

  // UI State
  selectedAssetId: string | null
  setSelectedAssetId: (id: string | null) => void
  
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (assetId: string) => void
  removeFromWatchlist: (assetId: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  // Assets
  assets: [],
  setAssets: (assets) => set({ assets }),
  updateAsset: (updatedAsset) => set((state) => ({
    assets: state.assets.map((asset) =>
      asset.id === updatedAsset.id ? updatedAsset : asset
    ),
  })),

  // Portfolio
  portfolio: [],
  addToPortfolio: (asset, quantity, averagePrice) => set((state) => {
    const existing = state.portfolio.find((p) => p.id === asset.id)
    
    if (existing) {
      // Atualiza quantidade e preço médio
      const totalQuantity = existing.quantity + quantity
      const newAveragePrice = 
        (existing.averagePrice * existing.quantity + averagePrice * quantity) / totalQuantity
      
      return {
        portfolio: state.portfolio.map((p) =>
          p.id === asset.id
            ? {
                ...p,
                quantity: totalQuantity,
                averagePrice: newAveragePrice,
                currentValue: asset.currentPrice * totalQuantity,
                profitLoss: (asset.currentPrice - newAveragePrice) * totalQuantity,
                profitLossPercent: ((asset.currentPrice - newAveragePrice) / newAveragePrice) * 100,
              }
            : p
        ),
      }
    }

    const currentValue = asset.currentPrice * quantity
    const profitLoss = (asset.currentPrice - averagePrice) * quantity
    const profitLossPercent = ((asset.currentPrice - averagePrice) / averagePrice) * 100

    return {
      portfolio: [
        ...state.portfolio,
        {
          ...asset,
          quantity,
          averagePrice,
          currentValue,
          profitLoss,
          profitLossPercent,
        },
      ],
    }
  }),

  removeFromPortfolio: (assetId) => set((state) => ({
    portfolio: state.portfolio.filter((p) => p.id !== assetId),
  })),

  updatePortfolioQuantity: (assetId, quantity) => set((state) => ({
    portfolio: state.portfolio.map((p) =>
      p.id === assetId
        ? {
            ...p,
            quantity,
            currentValue: p.currentPrice * quantity,
            profitLoss: (p.currentPrice - p.averagePrice) * quantity,
          }
        : p
    ),
  })),

  // News
  news: [],
  setNews: (news) => set({ news }),

  // UI State
  selectedAssetId: null,
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Watchlist
  watchlist: [],
  addToWatchlist: (assetId) => set((state) => ({
    watchlist: state.watchlist.includes(assetId)
      ? state.watchlist
      : [...state.watchlist, assetId],
  })),
  removeFromWatchlist: (assetId) => set((state) => ({
    watchlist: state.watchlist.filter((id) => id !== assetId),
  })),
}))
