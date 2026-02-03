'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendUp,
  TrendDown,
  ChartLineUp,
  ArrowClockwise,
  Target,
  Lightning,
  ArrowUp,
  ArrowDown,
  Minus,
} from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { PriceChart } from '@/components/charts/PriceChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import type { Asset, PriceHistoryPoint, PredictionData } from '@/types'

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

const rangeToDays: Record<TimeRange, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 'max',
}

export default function AnalisesPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPredictionLoading, setIsPredictionLoading] = useState(false)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')

  // Carrega ativos
  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getAssets(20)
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
    fetchAssets()
  }, [fetchAssets])

  useEffect(() => {
    if (selectedAsset?.id) {
      fetchPrediction(selectedAsset.id)
      fetchPriceHistory(selectedAsset.id, selectedRange)
    }
  }, [selectedAsset, selectedRange, fetchPrediction, fetchPriceHistory])

  const handleRefresh = async () => {
    await fetchAssets()
    if (selectedAsset) {
      await fetchPrediction(selectedAsset.id)
      await fetchPriceHistory(selectedAsset.id, selectedRange)
    }
  }

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendUp weight="bold" className="w-5 h-5 text-price-up" />
      case 'bearish':
        return <TrendDown weight="bold" className="w-5 h-5 text-price-down" />
      default:
        return <Minus weight="bold" className="w-5 h-5 text-text-muted" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-price-up'
      case 'bearish':
        return 'text-price-down'
      default:
        return 'text-text-muted'
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'Alta'
      case 'bearish':
        return 'Baixa'
      default:
        return 'Neutro'
    }
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <ArrowUp weight="bold" className="w-4 h-4" />
      case 'down':
        return <ArrowDown weight="bold" className="w-4 h-4" />
      default:
        return <Minus weight="bold" className="w-4 h-4" />
    }
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
              <ChartLineUp weight="fill" className="w-8 h-8 text-accent-emerald" />
              Análises
            </motion.h1>
            <p className="text-text-muted mt-1">
              Indicadores técnicos e análise preditiva
            </p>
          </div>

          <Button variant="secondary" onClick={handleRefresh} disabled={isLoading || isPredictionLoading}>
            <ArrowClockwise weight="bold" className={`w-4 h-4 ${(isLoading || isPredictionLoading) ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Seletor de ativos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Selecionar Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-auto">
                  {assets.map((asset, index) => (
                    <motion.button
                      key={asset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                        selectedAsset?.id === asset.id
                          ? 'bg-accent-emerald/15 border border-accent-emerald/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      )}
                    >
                      {asset.image && (
                        <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{asset.symbol}</p>
                        <p className={`font-mono text-xs ${asset.priceChangePercent24h >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                          {formatPercent(asset.priceChangePercent24h)}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Área principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-3 space-y-6"
          >
            {selectedAsset && (
              <>
                {/* Resumo da Análise */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tendência */}
                  <Card variant="glass" padding="lg">
                    <div className="flex items-center gap-3 mb-4">
                      {getTrendIcon(prediction?.trend || 'neutral')}
                      <p className="text-sm text-text-muted">Tendência</p>
                    </div>
                    <p className={cn('text-2xl font-display font-bold', getTrendColor(prediction?.trend || 'neutral'))}>
                      {getTrendLabel(prediction?.trend || 'neutral')}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Baseado em médias móveis</p>
                  </Card>

                  {/* Previsão */}
                  <Card variant="glass" padding="lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightning weight="fill" className="w-5 h-5 text-accent-gold" />
                      <p className="text-sm text-text-muted">Previsão Curto Prazo</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(prediction?.prediction?.shortTerm || 'stable')}
                      <p className={cn(
                        'text-2xl font-display font-bold',
                        prediction?.prediction?.shortTerm === 'up' ? 'text-price-up' :
                        prediction?.prediction?.shortTerm === 'down' ? 'text-price-down' : 'text-text-muted'
                      )}>
                        {prediction?.prediction?.shortTerm === 'up' ? 'Subida' :
                         prediction?.prediction?.shortTerm === 'down' ? 'Queda' : 'Estável'}
                      </p>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Confiança: {prediction?.prediction?.confidence ? `${(prediction.prediction.confidence * 100).toFixed(0)}%` : '-'}
                    </p>
                  </Card>

                  {/* RSI */}
                  <Card variant="glass" padding="lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Target weight="fill" className="w-5 h-5 text-accent-emerald" />
                      <p className="text-sm text-text-muted">RSI (14)</p>
                    </div>
                    <p className={cn(
                      'text-2xl font-display font-bold',
                      prediction?.rsi && prediction.rsi > 70 ? 'text-price-down' :
                      prediction?.rsi && prediction.rsi < 30 ? 'text-price-up' : 'text-text-primary'
                    )}>
                      {prediction?.rsi?.toFixed(1) || '-'}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {prediction?.rsi && prediction.rsi > 70 ? 'Sobrecomprado' :
                       prediction?.rsi && prediction.rsi < 30 ? 'Sobrevendido' : 'Neutro'}
                    </p>
                  </Card>
                </div>

                {/* Indicadores Técnicos */}
                <Card variant="default" padding="lg">
                  <CardHeader>
                    <CardTitle>Indicadores Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPredictionLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : prediction ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* SMAs */}
                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-xs text-text-muted mb-2">SMA 7</p>
                          <p className="font-mono text-lg font-bold text-text-primary">
                            {formatCurrency(prediction.sma7)}
                          </p>
                          <Badge 
                            variant={selectedAsset.currentPrice > prediction.sma7 ? 'success' : 'danger'} 
                            size="sm"
                            className="mt-2"
                          >
                            {selectedAsset.currentPrice > prediction.sma7 ? 'Acima' : 'Abaixo'}
                          </Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-xs text-text-muted mb-2">SMA 14</p>
                          <p className="font-mono text-lg font-bold text-text-primary">
                            {formatCurrency(prediction.sma14)}
                          </p>
                          <Badge 
                            variant={selectedAsset.currentPrice > prediction.sma14 ? 'success' : 'danger'} 
                            size="sm"
                            className="mt-2"
                          >
                            {selectedAsset.currentPrice > prediction.sma14 ? 'Acima' : 'Abaixo'}
                          </Badge>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-xs text-text-muted mb-2">SMA 30</p>
                          <p className="font-mono text-lg font-bold text-text-primary">
                            {formatCurrency(prediction.sma30)}
                          </p>
                          <Badge 
                            variant={selectedAsset.currentPrice > prediction.sma30 ? 'success' : 'danger'} 
                            size="sm"
                            className="mt-2"
                          >
                            {selectedAsset.currentPrice > prediction.sma30 ? 'Acima' : 'Abaixo'}
                          </Badge>
                        </div>

                        {/* EMAs */}
                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-xs text-text-muted mb-2">EMA 7</p>
                          <p className="font-mono text-lg font-bold text-text-primary">
                            {formatCurrency(prediction.ema7)}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5">
                          <p className="text-xs text-text-muted mb-2">EMA 14</p>
                          <p className="font-mono text-lg font-bold text-text-primary">
                            {formatCurrency(prediction.ema14)}
                          </p>
                        </div>

                        {/* Suporte e Resistência */}
                        <div className="p-4 rounded-xl bg-price-up/10 border border-price-up/20">
                          <p className="text-xs text-text-muted mb-2">Resistência</p>
                          <p className="font-mono text-lg font-bold text-price-up">
                            {formatCurrency(prediction.resistance)}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-price-down/10 border border-price-down/20">
                          <p className="text-xs text-text-muted mb-2">Suporte</p>
                          <p className="font-mono text-lg font-bold text-price-down">
                            {formatCurrency(prediction.support)}
                          </p>
                        </div>

                        {/* Preço Atual */}
                        <div className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20">
                          <p className="text-xs text-text-muted mb-2">Preço Atual</p>
                          <p className="font-mono text-lg font-bold text-accent-emerald">
                            {formatCurrency(selectedAsset.currentPrice)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-text-muted">
                          Análise não disponível para este ativo
                        </p>
                      </div>
                    )}
                  </CardContent>
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
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
