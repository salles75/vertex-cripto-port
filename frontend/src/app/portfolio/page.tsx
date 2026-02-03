'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MagnifyingGlass, X, Wallet, ArrowClockwise, TrendUp, TrendDown } from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { PortfolioCard } from '@/components/portfolio/PortfolioCard'
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary'
import { PriceChart } from '@/components/charts/PriceChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { Asset, PortfolioAsset, PriceHistoryPoint } from '@/types'

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

const rangeToDays: Record<TimeRange, number | 'max'> = {
  '1D': 1,
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 'max', // Máximo disponível (1 ano na API gratuita)
}

// Chave para localStorage
const PORTFOLIO_STORAGE_KEY = 'ativos-financeiros-portfolio'

// Portfólio inicial (somente se não houver dados salvos)
const DEFAULT_PORTFOLIO = [
  { assetId: 'bitcoin', quantity: 0.5, averagePrice: 45000 },
  { assetId: 'ethereum', quantity: 5, averagePrice: 2800 },
  { assetId: 'solana', quantity: 25, averagePrice: 120 },
]

// Tipo para dados salvos no localStorage
interface SavedPortfolioItem {
  assetId: string
  quantity: number
  averagePrice: number
}

// Funções de persistência no localStorage
const savePortfolioToStorage = (portfolio: SavedPortfolioItem[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio))
  }
}

const loadPortfolioFromStorage = (): SavedPortfolioItem[] | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        console.error('Erro ao carregar portfólio do localStorage')
      }
    }
  }
  return null
}

export default function PortfolioPage() {
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([])
  const [savedPortfolioConfig, setSavedPortfolioConfig] = useState<SavedPortfolioItem[]>([])
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAsset | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')
  
  // Form state
  const [formAssetId, setFormAssetId] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formSearch, setFormSearch] = useState('')

  // Busca ativos disponíveis
  const fetchAssets = useCallback(async () => {
    try {
      const assets = await api.getAssets(100)
      setAvailableAssets(assets)
      return assets
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
      return []
    }
  }, [])

  // Constrói o portfólio com dados atualizados
  const buildPortfolio = useCallback((assets: Asset[], savedItems: SavedPortfolioItem[]) => {
    const portfolioAssets: PortfolioAsset[] = savedItems
      .map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)
        if (!asset) return null

        const currentValue = asset.currentPrice * item.quantity
        const investedValue = item.averagePrice * item.quantity
        const profitLoss = currentValue - investedValue
        const profitLossPercent = investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0

        return {
          ...asset,
          quantity: item.quantity,
          averagePrice: item.averagePrice,
          currentValue,
          profitLoss,
          profitLossPercent,
        } as PortfolioAsset
      })
      .filter((a): a is PortfolioAsset => a !== null)

    return portfolioAssets
  }, [])

  // Carrega dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // Carrega configuração do localStorage ou usa padrão
      const savedConfig = loadPortfolioFromStorage()
      const portfolioConfig = savedConfig || DEFAULT_PORTFOLIO
      setSavedPortfolioConfig(portfolioConfig)
      
      // Se não tinha dados salvos, salva o padrão
      if (!savedConfig) {
        savePortfolioToStorage(DEFAULT_PORTFOLIO)
      }
      
      const assets = await fetchAssets()
      const portfolioData = buildPortfolio(assets, portfolioConfig)
      setPortfolio(portfolioData)
      
      if (portfolioData.length > 0) {
        setSelectedAsset(portfolioData[0])
      }
      setIsLoading(false)
    }
    loadData()
  }, [fetchAssets, buildPortfolio])

  // Salva no localStorage sempre que o portfólio mudar
  useEffect(() => {
    if (portfolio.length > 0 || savedPortfolioConfig.length > 0) {
      const configToSave = portfolio.map((p) => ({
        assetId: p.id,
        quantity: p.quantity,
        averagePrice: p.averagePrice,
      }))
      
      // Só salva se houver mudanças
      if (JSON.stringify(configToSave) !== JSON.stringify(savedPortfolioConfig)) {
        savePortfolioToStorage(configToSave)
        setSavedPortfolioConfig(configToSave)
      }
    }
  }, [portfolio, savedPortfolioConfig])

  // Busca histórico quando ativo selecionado muda
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
    const currentPortfolioConfig = portfolio.map((p) => ({
      assetId: p.id,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
    }))
    const portfolioData = buildPortfolio(assets, currentPortfolioConfig)
    setPortfolio(portfolioData)
    
    if (selectedAsset) {
      const updated = portfolioData.find((a) => a.id === selectedAsset.id)
      if (updated) setSelectedAsset(updated)
    }
    setIsLoading(false)
  }

  const handleDelete = (assetId: string) => {
    const newPortfolio = portfolio.filter((a) => a.id !== assetId)
    setPortfolio(newPortfolio)
    
    // Atualiza localStorage imediatamente
    const configToSave = newPortfolio.map((p) => ({
      assetId: p.id,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
    }))
    savePortfolioToStorage(configToSave)
    setSavedPortfolioConfig(configToSave)
    
    if (selectedAsset?.id === assetId) {
      setSelectedAsset(newPortfolio.length > 0 ? newPortfolio[0] : null)
    }
  }

  const handleAddAsset = () => {
    if (!formAssetId || !formQuantity || !formPrice) return

    const asset = availableAssets.find((a) => a.id === formAssetId)
    if (!asset) return

    const quantity = parseFloat(formQuantity)
    const averagePrice = parseFloat(formPrice)

    const currentValue = asset.currentPrice * quantity
    const investedValue = averagePrice * quantity
    const profitLoss = currentValue - investedValue
    const profitLossPercent = investedValue > 0 ? ((currentValue - investedValue) / investedValue) * 100 : 0

    const newAsset: PortfolioAsset = {
      ...asset,
      quantity,
      averagePrice,
      currentValue,
      profitLoss,
      profitLossPercent,
    }

    // Verifica se já existe no portfólio
    const existingIndex = portfolio.findIndex((p) => p.id === formAssetId)
    let newPortfolio: PortfolioAsset[]
    
    if (existingIndex >= 0) {
      // Atualiza existente (calcula novo preço médio)
      const existing = portfolio[existingIndex]
      const totalQuantity = existing.quantity + quantity
      const newAvgPrice = 
        (existing.averagePrice * existing.quantity + averagePrice * quantity) / totalQuantity

      const updatedAsset: PortfolioAsset = {
        ...existing,
        quantity: totalQuantity,
        averagePrice: newAvgPrice,
        currentValue: existing.currentPrice * totalQuantity,
        profitLoss: (existing.currentPrice - newAvgPrice) * totalQuantity,
        profitLossPercent: ((existing.currentPrice - newAvgPrice) / newAvgPrice) * 100,
      }

      newPortfolio = portfolio.map((p, i) => i === existingIndex ? updatedAsset : p)
    } else {
      newPortfolio = [...portfolio, newAsset]
    }
    
    setPortfolio(newPortfolio)
    
    // Salva imediatamente no localStorage
    const configToSave = newPortfolio.map((p) => ({
      assetId: p.id,
      quantity: p.quantity,
      averagePrice: p.averagePrice,
    }))
    savePortfolioToStorage(configToSave)
    setSavedPortfolioConfig(configToSave)

    // Reset form
    setFormAssetId('')
    setFormQuantity('')
    setFormPrice('')
    setFormSearch('')
    setIsAddModalOpen(false)
  }

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
  }

  const filteredPortfolio = portfolio.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAvailableAssets = availableAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(formSearch.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(formSearch.toLowerCase())
  )

  // Calcula totais
  const totalValue = portfolio.reduce((sum, a) => sum + a.currentValue, 0)
  const totalInvested = portfolio.reduce((sum, a) => sum + (a.averagePrice * a.quantity), 0)
  const totalProfitLoss = totalValue - totalInvested
  const totalProfitLossPercent = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0

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
              Portfólio
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-text-muted">
                Gerencie seus investimentos
              </p>
              <Badge 
                variant={totalProfitLoss >= 0 ? 'success' : 'danger'} 
                size="sm"
              >
                {totalProfitLoss >= 0 ? <TrendUp weight="bold" className="w-3 h-3 mr-1" /> : <TrendDown weight="bold" className="w-3 h-3 mr-1" />}
                {formatPercent(totalProfitLossPercent)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleRefresh} disabled={isLoading}>
              <ArrowClockwise weight="bold" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus weight="bold" className="w-4 h-4" />
              Adicionar Ativo
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Valor Total</p>
            <p className="font-mono text-xl font-bold text-text-primary">
              {formatCurrency(totalValue)}
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Investido</p>
            <p className="font-mono text-xl font-bold text-text-primary">
              {formatCurrency(totalInvested)}
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Lucro/Prejuízo</p>
            <p className={`font-mono text-xl font-bold ${totalProfitLoss >= 0 ? 'text-price-up' : 'text-price-down'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
            </p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Ativos</p>
            <p className="font-mono text-xl font-bold text-text-primary">
              {portfolio.length}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Portfolio Summary & Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 space-y-6"
          >
            <PortfolioSummary assets={portfolio} />

            {selectedAsset && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {selectedAsset.image && (
                      <img src={selectedAsset.image} alt={selectedAsset.name} className="w-6 h-6 rounded" />
                    )}
                    {selectedAsset.symbol}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Quantidade</span>
                      <span className="font-mono text-sm text-text-primary">{selectedAsset.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Preço Médio</span>
                      <span className="font-mono text-sm text-text-primary">{formatCurrency(selectedAsset.averagePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-muted">Preço Atual</span>
                      <span className="font-mono text-sm text-text-primary">{formatCurrency(selectedAsset.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border-subtle">
                      <span className="text-sm text-text-muted">Retorno</span>
                      <span className={`font-mono text-sm font-bold ${selectedAsset.profitLossPercent >= 0 ? 'text-price-up' : 'text-price-down'}`}>
                        {formatPercent(selectedAsset.profitLossPercent)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Portfolio Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Chart */}
            {selectedAsset && priceHistory.length > 0 && (
              <PriceChart
                data={priceHistory}
                symbol={selectedAsset.symbol}
                currentPrice={selectedAsset.currentPrice}
                isLoading={isChartLoading}
                onRangeChange={handleRangeChange}
              />
            )}

            {/* Asset Cards */}
            <Card variant="default" padding="lg">
              <CardHeader
                action={
                  <div className="relative w-64">
                    <MagnifyingGlass
                      weight="duotone"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                    />
                    <input
                      type="text"
                      placeholder="Buscar no portfólio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-glass pl-10 pr-4 py-2 text-sm"
                    />
                  </div>
                }
              >
                <CardTitle>Meus Ativos ({portfolio.length})</CardTitle>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredPortfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPortfolio.map((asset, index) => (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={selectedAsset?.id === asset.id ? 'ring-2 ring-accent-emerald rounded-2xl' : ''}
                      >
                        <PortfolioCard
                          asset={asset}
                          onEdit={() => {}}
                          onDelete={() => handleDelete(asset.id)}
                          animationDelay={index * 0.1}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted mb-4">
                      {searchQuery
                        ? 'Nenhum ativo encontrado'
                        : 'Seu portfólio está vazio'}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="outline"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        <Plus weight="bold" className="w-4 h-4" />
                        Adicionar primeiro ativo
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add Asset Modal */}
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
                    <CardTitle>Adicionar Ativo</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Asset Search */}
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Criptomoeda
                        </label>
                        <div className="relative">
                          <MagnifyingGlass
                            weight="duotone"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                          />
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={formSearch}
                            onChange={(e) => setFormSearch(e.target.value)}
                            className="input-glass pl-10"
                          />
                        </div>
                        
                        {formSearch && (
                          <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-background-tertiary border border-border-subtle">
                            {filteredAvailableAssets.slice(0, 5).map((asset) => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  setFormAssetId(asset.id)
                                  setFormSearch(asset.name)
                                  setFormPrice(asset.currentPrice.toString())
                                }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                              >
                                {asset.image && (
                                  <img src={asset.image} alt={asset.name} className="w-6 h-6 rounded" />
                                )}
                                <div className="text-left">
                                  <p className="text-sm text-text-primary">{asset.name}</p>
                                  <p className="text-xs text-text-muted">{asset.symbol}</p>
                                </div>
                                <span className="ml-auto font-mono text-sm text-text-secondary">
                                  {formatCurrency(asset.currentPrice)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.0001"
                          value={formQuantity}
                          onChange={(e) => setFormQuantity(e.target.value)}
                          className="input-glass font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Preço Médio de Compra (USD)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="input-glass font-mono"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => setIsAddModalOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="button" 
                          variant="primary" 
                          className="flex-1"
                          onClick={handleAddAsset}
                          disabled={!formAssetId || !formQuantity || !formPrice}
                        >
                          Adicionar
                        </Button>
                      </div>
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
