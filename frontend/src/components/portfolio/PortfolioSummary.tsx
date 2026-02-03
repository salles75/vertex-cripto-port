'use client'

import { useMemo } from 'react'
import { 
  Wallet, 
  TrendUp, 
  TrendDown, 
  CurrencyDollar,
  ChartPie
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import type { PortfolioAsset } from '@/types'

interface PortfolioSummaryProps {
  assets: PortfolioAsset[]
}

const COLORS = [
  '#10b981', // emerald
  '#f59e0b', // gold
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
]

export function PortfolioSummary({ assets }: PortfolioSummaryProps) {
  const stats = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0)
    const totalInvested = assets.reduce((sum, a) => sum + (a.averagePrice * a.quantity), 0)
    const totalProfitLoss = totalValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0 
      ? ((totalValue - totalInvested) / totalInvested) * 100 
      : 0

    const bestPerformer = assets.length > 0 
      ? assets.reduce((best, a) => a.profitLossPercent > best.profitLossPercent ? a : best)
      : null
    const worstPerformer = assets.length > 0
      ? assets.reduce((worst, a) => a.profitLossPercent < worst.profitLossPercent ? a : worst)
      : null

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
      bestPerformer,
      worstPerformer,
      assetCount: assets.length,
    }
  }, [assets])

  const chartData = useMemo(() => {
    return assets.map((asset) => ({
      name: asset.symbol,
      value: asset.currentValue,
      percent: (asset.currentValue / stats.totalValue) * 100,
    })).sort((a, b) => b.value - a.value)
  }, [assets, stats.totalValue])

  const isPositive = stats.totalProfitLoss >= 0

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="glass-card p-3">
          <p className="font-display font-medium text-text-primary">{data.name}</p>
          <p className="font-mono text-sm text-text-secondary">
            {formatCurrency(data.value)} ({data.percent.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card variant="glass" glow={isPositive ? 'emerald' : 'none'} padding="lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-emerald/15">
            <Wallet weight="duotone" className="w-5 h-5 text-accent-emerald" />
          </div>
          <div>
            <CardTitle>Resumo do Portfólio</CardTitle>
            <p className="text-sm text-text-muted">{stats.assetCount} ativos</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-6"
        >
          <p className="text-sm text-text-muted mb-1">Valor Total</p>
          <p className="font-mono text-4xl font-bold text-text-primary mb-2">
            {formatCurrency(stats.totalValue)}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isPositive ? 'success' : 'danger'} size="lg">
              {isPositive ? (
                <TrendUp weight="bold" className="w-4 h-4 mr-1" />
              ) : (
                <TrendDown weight="bold" className="w-4 h-4 mr-1" />
              )}
              {formatPercent(stats.totalProfitLossPercent)}
            </Badge>
            <span 
              className={cn(
                'font-mono text-sm',
                isPositive ? 'text-price-up' : 'text-price-down'
              )}
            >
              {isPositive ? '+' : ''}{formatCurrency(stats.totalProfitLoss)}
            </span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-background-tertiary/50">
            <div className="flex items-center gap-2 mb-2">
              <CurrencyDollar weight="duotone" className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">Total Investido</span>
            </div>
            <p className="font-mono text-lg font-semibold text-text-primary">
              {formatCurrency(stats.totalInvested)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-background-tertiary/50">
            <div className="flex items-center gap-2 mb-2">
              <ChartPie weight="duotone" className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">Nº de Ativos</span>
            </div>
            <p className="font-mono text-lg font-semibold text-text-primary">
              {stats.assetCount}
            </p>
          </div>
        </div>

        {/* Pie Chart */}
        {assets.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-text-secondary mb-3">Distribuição</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-text-muted">
                    {item.name} ({item.percent.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best/Worst Performers */}
        {(stats.bestPerformer || stats.worstPerformer) && (
          <div className="grid grid-cols-2 gap-3">
            {stats.bestPerformer && (
              <div className="p-3 rounded-xl bg-price-up/10 border border-price-up/20">
                <p className="text-xs text-price-up mb-1">Melhor Desempenho</p>
                <p className="font-display font-medium text-text-primary">
                  {stats.bestPerformer.symbol}
                </p>
                <p className="font-mono text-sm text-price-up">
                  {formatPercent(stats.bestPerformer.profitLossPercent)}
                </p>
              </div>
            )}
            {stats.worstPerformer && (
              <div className="p-3 rounded-xl bg-price-down/10 border border-price-down/20">
                <p className="text-xs text-price-down mb-1">Pior Desempenho</p>
                <p className="font-display font-medium text-text-primary">
                  {stats.worstPerformer.symbol}
                </p>
                <p className="font-mono text-sm text-price-down">
                  {formatPercent(stats.worstPerformer.profitLossPercent)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {assets.length === 0 && (
          <div className="text-center py-8">
            <Wallet weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Nenhum ativo no portfólio</p>
            <p className="text-sm text-text-muted mt-1">
              Adicione ativos para começar a acompanhar
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
