'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRinging,
  Plus,
  Trash,
  Check,
  X,
  TrendUp,
  TrendDown,
  ArrowClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import type { Asset } from '@/types'

// Tipos para alertas
interface PriceAlert {
  id: string
  assetId: string
  assetName: string
  assetSymbol: string
  assetImage?: string
  type: 'above' | 'below'
  targetPrice: number
  currentPrice: number
  createdAt: Date
  triggered: boolean
  triggeredAt?: Date
}

// Chave localStorage
const ALERTS_STORAGE_KEY = 'ativos-financeiros-alerts'

// Funções de persistência
const saveAlertsToStorage = (alerts: PriceAlert[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts))
  }
}

const loadAlertsFromStorage = (): PriceAlert[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(ALERTS_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved).map((a: PriceAlert) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          triggeredAt: a.triggeredAt ? new Date(a.triggeredAt) : undefined,
        }))
      } catch {
        console.error('Erro ao carregar alertas')
      }
    }
  }
  return []
}

export default function NotificacoesPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [alertType, setAlertType] = useState<'above' | 'below'>('above')
  const [targetPrice, setTargetPrice] = useState('')

  // Carrega ativos e alertas
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.getAssets(100)
      setAssets(data)
      
      // Carrega alertas salvos
      const savedAlerts = loadAlertsFromStorage()
      
      // Atualiza preços atuais e verifica triggers
      const updatedAlerts = savedAlerts.map(alert => {
        const asset = data.find(a => a.id === alert.assetId)
        if (asset) {
          const wasTriggered = alert.triggered
          const isNowTriggered = 
            (alert.type === 'above' && asset.currentPrice >= alert.targetPrice) ||
            (alert.type === 'below' && asset.currentPrice <= alert.targetPrice)
          
          return {
            ...alert,
            currentPrice: asset.currentPrice,
            triggered: isNowTriggered,
            triggeredAt: !wasTriggered && isNowTriggered ? new Date() : alert.triggeredAt,
          }
        }
        return alert
      })
      
      setAlerts(updatedAlerts)
      saveAlertsToStorage(updatedAlerts)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddAlert = () => {
    if (!selectedAsset || !targetPrice) return

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      assetSymbol: selectedAsset.symbol,
      assetImage: selectedAsset.image,
      type: alertType,
      targetPrice: parseFloat(targetPrice),
      currentPrice: selectedAsset.currentPrice,
      createdAt: new Date(),
      triggered: false,
    }

    const newAlerts = [...alerts, newAlert]
    setAlerts(newAlerts)
    saveAlertsToStorage(newAlerts)

    // Reset form
    setSelectedAsset(null)
    setTargetPrice('')
    setAlertType('above')
    setSearchQuery('')
    setIsAddModalOpen(false)
  }

  const handleDeleteAlert = (alertId: string) => {
    const newAlerts = alerts.filter(a => a.id !== alertId)
    setAlerts(newAlerts)
    saveAlertsToStorage(newAlerts)
  }

  const handleClearTriggered = () => {
    const newAlerts = alerts.filter(a => !a.triggered)
    setAlerts(newAlerts)
    saveAlertsToStorage(newAlerts)
  }

  const filteredAssets = assets.filter(
    asset =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

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
              <Bell weight="fill" className="w-8 h-8 text-accent-gold" />
              Notificações
            </motion.h1>
            <p className="text-text-muted mt-1">
              Configure alertas de preço para seus ativos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={fetchData} disabled={isLoading}>
              <ArrowClockwise weight="bold" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus weight="bold" className="w-4 h-4" />
              Novo Alerta
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Total de Alertas</p>
            <p className="font-mono text-xl font-bold text-text-primary">{alerts.length}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Alertas Ativos</p>
            <p className="font-mono text-xl font-bold text-accent-emerald">{activeAlerts.length}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Disparados</p>
            <p className="font-mono text-xl font-bold text-accent-gold">{triggeredAlerts.length}</p>
          </Card>
          <Card variant="glass" padding="md">
            <p className="text-xs text-text-muted mb-1">Subida / Queda</p>
            <p className="font-mono text-xl font-bold text-text-primary">
              {alerts.filter(a => a.type === 'above').length} / {alerts.filter(a => a.type === 'below').length}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Alertas Ativos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell weight="duotone" className="w-5 h-5 text-accent-emerald" />
                  Alertas Ativos ({activeAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {activeAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-white/5 border border-border-subtle"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {alert.assetImage && (
                              <img src={alert.assetImage} alt={alert.assetName} className="w-10 h-10 rounded-lg" />
                            )}
                            <div>
                              <p className="font-medium text-text-primary">{alert.assetSymbol}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={alert.type === 'above' ? 'success' : 'danger'} size="sm">
                                  {alert.type === 'above' ? (
                                    <TrendUp weight="bold" className="w-3 h-3 mr-1" />
                                  ) : (
                                    <TrendDown weight="bold" className="w-3 h-3 mr-1" />
                                  )}
                                  {alert.type === 'above' ? 'Acima de' : 'Abaixo de'}
                                </Badge>
                                <span className="font-mono text-sm text-accent-gold">
                                  {formatCurrency(alert.targetPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-muted">Preço atual</p>
                            <p className="font-mono text-sm text-text-primary">
                              {formatCurrency(alert.currentPrice)}
                            </p>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="mt-2 p-1.5 rounded-lg text-text-muted hover:text-price-down hover:bg-price-down/10 transition-all"
                            >
                              <Trash weight="bold" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted mb-4">Nenhum alerta ativo</p>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                      <Plus weight="bold" className="w-4 h-4" />
                      Criar alerta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Alertas Disparados */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader
                action={
                  triggeredAlerts.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearTriggered}>
                      <Trash weight="bold" className="w-4 h-4" />
                      Limpar
                    </Button>
                  )
                }
              >
                <CardTitle className="flex items-center gap-2">
                  <BellRinging weight="fill" className="w-5 h-5 text-accent-gold" />
                  Disparados ({triggeredAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {triggeredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {triggeredAlerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'p-4 rounded-xl border',
                          alert.type === 'above' 
                            ? 'bg-price-up/10 border-price-up/30' 
                            : 'bg-price-down/10 border-price-down/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'p-2 rounded-lg',
                              alert.type === 'above' ? 'bg-price-up/20' : 'bg-price-down/20'
                            )}>
                              <Check weight="bold" className={cn(
                                'w-5 h-5',
                                alert.type === 'above' ? 'text-price-up' : 'text-price-down'
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{alert.assetSymbol}</p>
                              <p className="text-xs text-text-muted">
                                {alert.type === 'above' ? 'Atingiu' : 'Caiu para'} {formatCurrency(alert.targetPrice)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm text-text-primary">
                              {formatCurrency(alert.currentPrice)}
                            </p>
                            <p className="text-xs text-text-muted">
                              {alert.triggeredAt?.toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Check weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">Nenhum alerta disparado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Modal Novo Alerta */}
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
                    <CardTitle>Novo Alerta de Preço</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Busca de ativo */}
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Ativo
                        </label>
                        <div className="relative">
                          <MagnifyingGlass
                            weight="duotone"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                          />
                          <input
                            type="text"
                            placeholder="Buscar ativo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-glass pl-10"
                          />
                        </div>
                        
                        {searchQuery && !selectedAsset && (
                          <div className="mt-2 max-h-40 overflow-auto rounded-xl bg-background-tertiary border border-border-subtle">
                            {filteredAssets.slice(0, 5).map(asset => (
                              <button
                                key={asset.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAsset(asset)
                                  setSearchQuery(asset.name)
                                  setTargetPrice(asset.currentPrice.toString())
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

                        {selectedAsset && (
                          <div className="mt-2 p-3 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 flex items-center gap-3">
                            {selectedAsset.image && (
                              <img src={selectedAsset.image} alt={selectedAsset.name} className="w-8 h-8 rounded" />
                            )}
                            <div>
                              <p className="font-medium text-text-primary">{selectedAsset.name}</p>
                              <p className="text-xs text-text-muted">Atual: {formatCurrency(selectedAsset.currentPrice)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tipo de alerta */}
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Alertar quando o preço
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAlertType('above')}
                            className={cn(
                              'p-3 rounded-xl border flex items-center justify-center gap-2 transition-all',
                              alertType === 'above'
                                ? 'bg-price-up/15 border-price-up/50 text-price-up'
                                : 'bg-white/5 border-border-subtle text-text-muted hover:bg-white/10'
                            )}
                          >
                            <TrendUp weight="bold" className="w-5 h-5" />
                            Subir acima
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertType('below')}
                            className={cn(
                              'p-3 rounded-xl border flex items-center justify-center gap-2 transition-all',
                              alertType === 'below'
                                ? 'bg-price-down/15 border-price-down/50 text-price-down'
                                : 'bg-white/5 border-border-subtle text-text-muted hover:bg-white/10'
                            )}
                          >
                            <TrendDown weight="bold" className="w-5 h-5" />
                            Cair abaixo
                          </button>
                        </div>
                      </div>

                      {/* Preço alvo */}
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Preço alvo (USD)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
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
                          onClick={handleAddAlert}
                          disabled={!selectedAsset || !targetPrice}
                        >
                          Criar Alerta
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
