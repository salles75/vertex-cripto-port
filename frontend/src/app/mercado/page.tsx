'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlass, ArrowClockwise } from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AssetList } from '@/components/assets/AssetList'
import { PriceChart } from '@/components/charts/PriceChart'
import { PredictionCard } from '@/components/analysis/PredictionCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import type { Asset, PriceHistoryPoint, PredictionData } from '@/types'

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

const rangeToDays: Record<TimeRange, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 'max', // Máximo disponível (1 ano na API gratuita)
}

export default function MercadoPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([])
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(['bitcoin', 'ethereum'])
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [isPredictionLoading, setIsPredictionLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')

  // Carrega ativos da API
  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getAssets(50)
      setAssets(data)
      if (data.length > 0 && !selectedAsset) {
        setSelectedAsset(data[0])
      }
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAsset])

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

  // Busca análise preditiva
  const fetchPrediction = useCallback(async (assetId: string) => {
    setIsPredictionLoading(true)
    try {
      const data = await api.getAnalysis(assetId)
      setPrediction(data)
    } catch (error) {
      console.error('Erro ao carregar análise:', error)
      setPrediction(null)
    } finally {
      setIsPredictionLoading(false)
    }
  }, [])

  // Carrega ativos inicialmente
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Carrega dados quando ativo selecionado muda
  useEffect(() => {
    if (selectedAsset?.id) {
      fetchPriceHistory(selectedAsset.id, selectedRange)
      fetchPrediction(selectedAsset.id)
    }
  }, [selectedAsset, selectedRange, fetchPriceHistory, fetchPrediction])

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset)
  }

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  const handleWatchlistToggle = (assetId: string) => {
    setWatchlist((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleRefresh = () => {
    fetchAssets()
    if (selectedAsset) {
      fetchPriceHistory(selectedAsset.id, selectedRange)
      fetchPrediction(selectedAsset.id)
    }
  }

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              className="text-3xl font-display font-bold text-text-primary"
            >
              Mercado
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-text-muted">
                Explore todas as criptomoedas disponíveis
              </p>
              <Badge variant="success" size="sm">
                <span className="w-2 h-2 bg-price-up rounded-full animate-pulse mr-1.5" />
                {assets.length} ativos
              </Badge>
            </div>
          </div>
          
          <Button variant="secondary" onClick={handleRefresh} disabled={isLoading}>
            <ArrowClockwise weight="bold" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Asset Detail - Gráfico e Análise */}
          <div className="xl:col-span-2 space-y-6">
            {selectedAsset && (
              <>
                {/* Selected Asset Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {selectedAsset.image && (
                          <img 
                            src={selectedAsset.image} 
                            alt={selectedAsset.name}
                            className="w-12 h-12 rounded-xl"
                          />
                        )}
                        <div>
                          <h2 className="font-display font-bold text-xl text-text-primary">
                            {selectedAsset.name}
                          </h2>
                          <p className="text-text-muted font-mono">{selectedAsset.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-2xl font-bold text-text-primary">
                          ${selectedAsset.currentPrice.toLocaleString()}
                        </p>
                        <Badge 
                          variant={selectedAsset.priceChangePercent24h >= 0 ? 'success' : 'danger'}
                          size="sm"
                        >
                          {selectedAsset.priceChangePercent24h >= 0 ? '+' : ''}
                          {selectedAsset.priceChangePercent24h.toFixed(2)}%
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Price Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <PriceChart
                    data={priceHistory}
                    symbol={selectedAsset.symbol}
                    currentPrice={selectedAsset.currentPrice}
                    isLoading={isChartLoading}
                    onRangeChange={handleRangeChange}
                  />
                </motion.div>

                {/* Technical Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {prediction ? (
                    <PredictionCard prediction={prediction} isLoading={isPredictionLoading} />
                  ) : (
                    <Card variant="default" padding="lg">
                      <div className="text-center py-8">
                        <p className="text-text-muted">
                          {isPredictionLoading ? 'Carregando análise...' : 'Análise técnica não disponível'}
                        </p>
                      </div>
                    </Card>
                  )}
                </motion.div>
              </>
            )}
          </div>

          {/* Asset List */}
          <div className="xl:col-span-1">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="relative">
                <MagnifyingGlass
                  weight="duotone"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Buscar criptomoedas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass pl-12 pr-4"
                />
              </div>
            </motion.div>

            {/* Asset List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="default" padding="md" className="max-h-[calc(100vh-300px)] overflow-auto">
                <CardHeader>
                  <CardTitle>{filteredAssets.length} Criptomoedas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => handleAssetClick(asset)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            selectedAsset?.id === asset.id
                              ? 'bg-accent-emerald/15 border border-accent-emerald/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {asset.image && (
                              <img 
                                src={asset.image} 
                                alt={asset.name}
                                className="w-8 h-8 rounded-lg"
                              />
                            )}
                            <div>
                              <p className="font-display font-medium text-sm text-text-primary">
                                {asset.name}
                              </p>
                              <p className="text-xs text-text-muted font-mono">{asset.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-semibold text-text-primary">
                              ${asset.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className={`text-xs font-mono ${
                              asset.priceChangePercent24h >= 0 ? 'text-price-up' : 'text-price-down'
                            }`}>
                              {asset.priceChangePercent24h >= 0 ? '+' : ''}
                              {asset.priceChangePercent24h.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
