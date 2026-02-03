'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrendUp, 
  TrendDown, 
  CurrencyDollar,
  ChartLineUp,
  Lightning,
  ArrowRight,
  Plus,
  ArrowClockwise
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AssetCard, AssetCardCompact } from '@/components/assets/AssetCard'
import { NewsFeed } from '@/components/news/NewsFeed'
import { PriceChart } from '@/components/charts/PriceChart'
import { cn, formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Asset, NewsArticle, PriceHistoryPoint } from '@/types'

interface DashboardClientProps {
  initialAssets: Asset[]
  initialNews: NewsArticle[]
  isLiveData?: boolean
}

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

const rangeToDays: Record<TimeRange, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 'max', // Máximo disponível (1 ano na API gratuita)
}

export function DashboardClient({ initialAssets, initialNews, isLiveData = false }: DashboardClientProps) {
  const [assets, setAssets] = useState(initialAssets)
  const [news, setNews] = useState(initialNews)
  const [selectedAsset, setSelectedAsset] = useState<Asset>(initialAssets[0])
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([])
  const [watchlist, setWatchlist] = useState<string[]>(['bitcoin', 'ethereum'])
  const [isLoading, setIsLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)

  // Evita erro de hidratação - horário só é mostrado no cliente
  useEffect(() => {
    setIsMounted(true)
    setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
  }, [])

  // Busca histórico de preços real da API
  const fetchPriceHistory = useCallback(async (assetId: string, range: TimeRange) => {
    setIsChartLoading(true)
    const days = rangeToDays[range]
    try {
      const history = await api.getPriceHistory(assetId, days)
      setPriceHistory(history)
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      // Fallback para dados mock se a API falhar
      const fallbackDays = days === 'max' ? 365 * 5 : (typeof days === 'number' ? days : 365)
      setPriceHistory(generateFallbackHistory(selectedAsset.currentPrice, fallbackDays))
    } finally {
      setIsChartLoading(false)
    }
  }, [selectedAsset.currentPrice])

  // Gera histórico fallback caso API falhe
  const generateFallbackHistory = (basePrice: number, days: number): PriceHistoryPoint[] => {
    const history: PriceHistoryPoint[] = []
    const now = Date.now()
    const pointsPerDay = days <= 1 ? 24 : days <= 7 ? 6 : 1

    for (let i = days * pointsPerDay; i >= 0; i--) {
      const timestamp = new Date(now - i * (86400000 / pointsPerDay))
      const randomChange = (Math.random() - 0.5) * 0.02
      const trendFactor = (days * pointsPerDay - i) / (days * pointsPerDay)
      const price = basePrice * (0.95 + trendFactor * 0.1 + randomChange)
      history.push({ timestamp, price })
    }
    return history
  }

  // Carrega histórico quando ativo ou range muda
  useEffect(() => {
    if (selectedAsset?.id) {
      fetchPriceHistory(selectedAsset.id, selectedRange)
    }
  }, [selectedAsset, selectedRange, fetchPriceHistory])

  // Função para atualizar todos os dados
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const [newAssets, newNews] = await Promise.all([
        api.getAssets(20),
        api.getNews(10),
      ])
      
      if (newAssets.length > 0) {
        setAssets(newAssets)
        // Atualiza o ativo selecionado com dados novos
        const updatedSelected = newAssets.find(a => a.id === selectedAsset.id)
        if (updatedSelected) {
          setSelectedAsset(updatedSelected)
        }
      }
      
      if (newNews.length > 0) {
        setNews(newNews)
      }
      
      // Recarrega histórico
      await fetchPriceHistory(selectedAsset.id, selectedRange)
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handler para mudança de período
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  // Handler para seleção de ativo
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset)
  }

  const handleWatchlistToggle = (assetId: string) => {
    setWatchlist((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  // Calcula estatísticas do mercado
  const marketStats = {
    totalMarketCap: assets.reduce((sum, a) => sum + (a.marketCap || 0), 0),
    totalVolume: assets.reduce((sum, a) => sum + a.volume24h, 0),
    gainers: assets.filter((a) => a.priceChangePercent24h > 0).length,
    losers: assets.filter((a) => a.priceChangePercent24h < 0).length,
  }

  const topGainer = assets.length > 0 
    ? assets.reduce((best, a) => a.priceChangePercent24h > best.priceChangePercent24h ? a : best)
    : null

  const topLoser = assets.length > 0
    ? assets.reduce((worst, a) => a.priceChangePercent24h < worst.priceChangePercent24h ? a : worst)
    : null

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
              Dashboard
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-text-muted">
                Visão geral do mercado de criptomoedas
              </p>
              {isLiveData ? (
                <Badge variant="success" size="sm">
                  <span className="w-2 h-2 bg-price-up rounded-full animate-pulse mr-1.5" />
                  Dados ao Vivo
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  Demonstração
                </Badge>
              )}
            </div>
            {isMounted && lastUpdate && (
              <p className="text-xs text-text-muted mt-1">
                Última atualização: {lastUpdate}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <ArrowClockwise weight="bold" className="w-4 h-4 animate-spin" />
              ) : (
                <Lightning weight="fill" className="w-4 h-4" />
              )}
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Link href="/portfolio">
              <Button variant="primary">
                <Plus weight="bold" className="w-4 h-4" />
                Adicionar Ativo
              </Button>
            </Link>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-emerald/15">
                  <CurrencyDollar weight="duotone" className="w-5 h-5 text-accent-emerald" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Market Cap Total</p>
                  <p className="font-mono text-lg font-bold text-text-primary">
                    ${formatNumber(marketStats.totalMarketCap)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-gold/15">
                  <ChartLineUp weight="duotone" className="w-5 h-5 text-accent-gold" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Volume 24h</p>
                  <p className="font-mono text-lg font-bold text-text-primary">
                    ${formatNumber(marketStats.totalVolume)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-price-up/15">
                  <TrendUp weight="duotone" className="w-5 h-5 text-price-up" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Em Alta</p>
                  <p className="font-mono text-lg font-bold text-price-up">
                    {marketStats.gainers} ativos
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-price-down/15">
                  <TrendDown weight="duotone" className="w-5 h-5 text-price-down" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Em Baixa</p>
                  <p className="font-mono text-lg font-bold text-price-down">
                    {marketStats.losers} ativos
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Chart + Assets */}
          <div className="xl:col-span-2 space-y-6">
            {/* Price Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PriceChart
                data={priceHistory}
                symbol={selectedAsset.symbol}
                currentPrice={selectedAsset.currentPrice}
                isLoading={isChartLoading}
                onRangeChange={handleRangeChange}
              />
            </motion.div>

            {/* Top Movers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="default" padding="lg">
                <CardHeader
                  action={
                    <Link href="/mercado">
                      <Button variant="ghost" size="sm">
                        Ver todos
                        <ArrowRight weight="bold" className="w-4 h-4" />
                      </Button>
                    </Link>
                  }
                >
                  <CardTitle>Destaques do Dia</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Gainer */}
                    {topGainer && (
                      <div 
                        className="p-4 rounded-xl bg-price-up/10 border border-price-up/20 cursor-pointer hover:bg-price-up/15 transition-colors"
                        onClick={() => handleAssetSelect(topGainer)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="success" size="sm">
                            <TrendUp weight="bold" className="w-3 h-3 mr-1" />
                            Maior Alta
                          </Badge>
                          <span className="font-mono text-sm text-price-up">
                            {formatPercent(topGainer.priceChangePercent24h)}
                          </span>
                        </div>
                        <p className="font-display font-semibold text-text-primary">
                          {topGainer.name}
                        </p>
                        <p className="font-mono text-lg font-bold text-text-primary mt-1">
                          {formatCurrency(topGainer.currentPrice)}
                        </p>
                      </div>
                    )}

                    {/* Top Loser */}
                    {topLoser && (
                      <div 
                        className="p-4 rounded-xl bg-price-down/10 border border-price-down/20 cursor-pointer hover:bg-price-down/15 transition-colors"
                        onClick={() => handleAssetSelect(topLoser)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="danger" size="sm">
                            <TrendDown weight="bold" className="w-3 h-3 mr-1" />
                            Maior Baixa
                          </Badge>
                          <span className="font-mono text-sm text-price-down">
                            {formatPercent(topLoser.priceChangePercent24h)}
                          </span>
                        </div>
                        <p className="font-display font-semibold text-text-primary">
                          {topLoser.name}
                        </p>
                        <p className="font-mono text-lg font-bold text-text-primary mt-1">
                          {formatCurrency(topLoser.currentPrice)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Assets Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card variant="default" padding="lg">
                <CardHeader
                  action={
                    <Link href="/mercado">
                      <Button variant="ghost" size="sm">
                        Ver todos
                        <ArrowRight weight="bold" className="w-4 h-4" />
                      </Button>
                    </Link>
                  }
                >
                  <CardTitle>Principais Criptomoedas</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assets.slice(0, 4).map((asset, index) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => handleAssetSelect(asset)}
                        onWatchlistToggle={() => handleWatchlistToggle(asset.id)}
                        isWatchlisted={watchlist.includes(asset.id)}
                        showDetails={false}
                        animationDelay={index * 0.1}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Watchlist */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="default" padding="lg">
                <CardHeader
                  action={
                    <Link href="/watchlist">
                      <Button variant="ghost" size="sm">
                        <ArrowRight weight="bold" className="w-4 h-4" />
                      </Button>
                    </Link>
                  }
                >
                  <CardTitle>Watchlist</CardTitle>
                </CardHeader>
                
                <CardContent>
                  {watchlist.length > 0 ? (
                    <div className="space-y-1">
                      {assets
                        .filter((a) => watchlist.includes(a.id))
                        .map((asset, index) => (
                          <AssetCardCompact
                            key={asset.id}
                            asset={asset}
                            onClick={() => handleAssetSelect(asset)}
                            animationDelay={index * 0.05}
                          />
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-text-muted py-4">
                      Nenhum ativo na watchlist
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* News Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NewsFeed 
                news={news} 
                maxItems={5}
                showSentimentSummary
                onViewAll={() => {}}
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
