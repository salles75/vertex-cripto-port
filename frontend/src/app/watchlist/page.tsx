'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  MagnifyingGlass,
  Plus,
  Trash,
  ArrowClockwise,
  TrendUp,
  TrendDown,
  Bell,
  X,
} from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { PriceChart } from '@/components/charts/PriceChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { Asset, PriceHistoryPoint } from '@/types'

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

const rangeToDays: Record<TimeRange, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 'max',
}

// Chave para localStorage
const WATCHLIST_STORAGE_KEY = 'ativos-financeiros-watchlist'

// Funções de persistência
const saveWatchlistToStorage = (ids: string[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(ids))
  }
}

const loadWatchlistFromStorage = (): string[] | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        console.error('Erro ao carregar watchlist do localStorage')
      }
    }
  }
  return null
}

export default function WatchlistPage() {
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [watchlistIds, setWatchlistIds] = useState<string[]>([])
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')

  // Carrega ativos disponíveis
  const fetchAssets = useCallback(async () => {
    try {
      const assets = await api.getAssets(100)
      setAllAssets(assets)
      return assets
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
      return []
    }
  }, [])

  // Carrega dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // Carrega watchlist do localStorage
      const savedWatchlist = loadWatchlistFromStorage()
      const ids = savedWatchlist || ['bitcoin', 'ethereum', 'solana']
      setWatchlistIds(ids)
      
      if (!savedWatchlist) {
        saveWatchlistToStorage(ids)
      }
      
      const assets = await fetchAssets()
      const watchedAssets = assets.filter(a => ids.includes(a.id))
      setWatchlistAssets(watchedAssets)
      
      if (watchedAssets.length > 0) {
        setSelectedAsset(watchedAssets[0])
      }
      
      setIsLoading(false)
    }
    loadData()
  }, [fetchAssets])

  // Atualiza watchlistAssets quando watchlistIds muda
  useEffect(() => {
    const watchedAssets = allAssets.filter(a => watchlistIds.includes(a.id))
    setWatchlistAssets(watchedAssets)
  }, [watchlistIds, allAssets])

  // Busca histórico de preços
  const fetchPriceHistory = useCallback(async (assetId: string, range: TimeRange) => {
    setIsChartLoading(true)
    try {
      const days = rangeToDays[range]
      const history = await api.getPriceHistory(assetId, days)
      setPriceHistory(history)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      setPriceHistory([])
    } finally {
      setIsChartLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedAsset?.id) {
      fetchPriceHistory(selectedAsset.id, selectedRange)
    }
  }, [selectedAsset, selectedRange, fetchPriceHistory])

  const handleRefresh = async () => {
    setIsLoading(true)
    const assets = await fetchAssets()
    const watchedAssets = assets.filter(a => watchlistIds.includes(a.id))
    setWatchlistAssets(watchedAssets)
    
    if (selectedAsset) {
      const updated = watchedAssets.find(a => a.id === selectedAsset.id)
      if (updated) setSelectedAsset(updated)
    }
    setIsLoading(false)
  }

  const handleAddToWatchlist = (assetId: string) => {
    if (!watchlistIds.includes(assetId)) {
      const newIds = [...watchlistIds, assetId]
      setWatchlistIds(newIds)
      saveWatchlistToStorage(newIds)
    }
    setIsAddModalOpen(false)
    setSearchQuery('')
  }

  const handleRemoveFromWatchlist = (assetId: string) => {
    const newIds = watchlistIds.filter(id => id !== assetId)
    setWatchlistIds(newIds)
    saveWatchlistToStorage(newIds)
    
    if (selectedAsset?.id === assetId) {
      const remaining = watchlistAssets.filter(a => a.id !== assetId)
      setSelectedAsset(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  const filteredAssets = allAssets.filter(
    asset =>
      !watchlistIds.includes(asset.id) &&
      (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Estatísticas da watchlist
  const watchlistStats = {
    total: watchlistAssets.length,
    gainers: watchlistAssets.filter(a => a.priceChangePercent24h > 0).length,
    losers: watchlistAssets.filter(a => a.priceChangePercent24h < 0).length,
    avgChange: watchlistAssets.length > 0
      ? watchlistAssets.reduce((sum, a) => sum + a.priceChangePercent24h, 0) / watchlistAssets.length
      : 0,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-display font-bold text-text-primary flex items-center gap-3"
            >
              <Star weight="fill" className="w-8 h-8 text-accent-gold" />
              Watchlist
            </motion.h1>
            <p className="text-text-muted mt-1">
              Acompanhe seus ativos favoritos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleRefresh} disabled={isLoading}>
              <ArrowClockwise weight="bold" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus weight="bold" className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Total na Watchlist</p>
            <p className="font-mono text-xl font-bold text-text-primary">
              {watchlistStats.total} ativos
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Em Alta</p>
            <p className="font-mono text-xl font-bold text-price-up">
              {watchlistStats.gainers}
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Em Baixa</p>
            <p className="font-mono text-xl font-bold text-price-down">
              {watchlistStats.losers}
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Média 24h</p>
            <p className={`font-mono text-xl font-bold ${watchlistStats.avgChange >= 0 ? 'text-price-up' : 'text-price-down'}`}>
              {formatPercent(watchlistStats.avgChange)}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Lista de ativos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Meus Favoritos ({watchlistAssets.length})</CardTitle>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : watchlistAssets.length > 0 ? (
                  <div className="space-y-2">
                    {watchlistAssets.map((asset, index) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          selectedAsset?.id === asset.id
                            ? 'bg-accent-emerald/15 border border-accent-emerald/30'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {asset.image && (
                              <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-lg" />
                            )}
                            <div>
                              <p className="font-medium text-text-primary">{asset.symbol}</p>
                              <p className="text-xs text-text-muted">{asset.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-text-primary">
                              {formatCurrency(asset.currentPrice)}
                            </p>
                            <p className={`font-mono text-xs ${asset.priceChangePercent24h >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                              {formatPercent(asset.priceChangePercent24h)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFromWatchlist(asset.id)
                            }}
                            className="p-1.5 rounded-lg text-text-muted hover:text-price-down hover:bg-price-down/10 transition-all ml-2"
                          >
                            <Trash weight="bold" className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted mb-4">Sua watchlist está vazia</p>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                      <Plus weight="bold" className="w-4 h-4" />
                      Adicionar ativo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Gráfico e detalhes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 space-y-6"
          >
            {selectedAsset ? (
              <>
                {/* Detalhes do ativo */}
                <Card variant="glass" padding="lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedAsset.image && (
                        <img src={selectedAsset.image} alt={selectedAsset.name} className="w-12 h-12 rounded-xl" />
                      )}
                      <div>
                        <h2 className="text-xl font-display font-bold text-text-primary">
                          {selectedAsset.name}
                        </h2>
                        <p className="text-text-muted">{selectedAsset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-bold text-text-primary">
                        {formatCurrency(selectedAsset.currentPrice)}
                      </p>
                      <Badge variant={selectedAsset.priceChangePercent24h >= 0 ? 'success' : 'danger'}>
                        {selectedAsset.priceChangePercent24h >= 0 ? (
                          <TrendUp weight="bold" className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendDown weight="bold" className="w-3 h-3 mr-1" />
                        )}
                        {formatPercent(selectedAsset.priceChangePercent24h)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-subtle">
                    <div>
                      <p className="text-xs text-text-muted">Máxima 24h</p>
                      <p className="font-mono text-sm text-text-primary">{formatCurrency(selectedAsset.high24h)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Mínima 24h</p>
                      <p className="font-mono text-sm text-text-primary">{formatCurrency(selectedAsset.low24h)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Volume 24h</p>
                      <p className="font-mono text-sm text-text-primary">${(selectedAsset.volume24h / 1e9).toFixed(2)}B</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Market Cap</p>
                      <p className="font-mono text-sm text-text-primary">${((selectedAsset.marketCap || 0) / 1e9).toFixed(2)}B</p>
                    </div>
                  </div>
                </Card>

                {/* Gráfico */}
                <PriceChart
                  data={priceHistory}
                  symbol={selectedAsset.symbol}
                  currentPrice={selectedAsset.currentPrice}
                  isLoading={isChartLoading}
                  onRangeChange={handleRangeChange}
                />
              </>
            ) : (
              <Card variant="default" padding="lg">
                <div className="text-center py-12">
                  <Star weight="duotone" className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted">
                    Selecione um ativo da watchlist para ver detalhes
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        </div>

        {/* Modal Adicionar */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsAddModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md"
              >
                <Card variant="elevated" padding="lg">
                  <CardHeader
                    action={
                      <button
                        onClick={() => setIsAddModalOpen(false)}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
                      >
                        <X weight="bold" className="w-5 h-5" />
                      </button>
                    }
                  >
                    <CardTitle>Adicionar à Watchlist</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="relative mb-4">
                      <MagnifyingGlass
                        weight="duotone"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                      />
                      <input
                        type="text"
                        placeholder="Buscar criptomoeda..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-glass pl-10"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-80 overflow-auto space-y-1">
                      {filteredAssets.slice(0, 10).map(asset => (
                        <button
                          key={asset.id}
                          onClick={() => handleAddToWatchlist(asset.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          {asset.image && (
                            <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-lg" />
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-text-primary">{asset.name}</p>
                            <p className="text-xs text-text-muted">{asset.symbol}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-text-secondary">
                              {formatCurrency(asset.currentPrice)}
                            </p>
                            <p className={`font-mono text-xs ${asset.priceChangePercent24h >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                              {formatPercent(asset.priceChangePercent24h)}
                            </p>
                          </div>
                          <Plus weight="bold" className="w-5 h-5 text-accent-emerald" />
                        </button>
                      ))}
                      {filteredAssets.length === 0 && (
                        <p className="text-center text-text-muted py-4">
                          Nenhum ativo encontrado
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
