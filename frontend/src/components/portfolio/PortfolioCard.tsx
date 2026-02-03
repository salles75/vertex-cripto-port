'use client'

import Image from 'next/image'
import { 
  TrendUp, 
  TrendDown, 
  Trash,
  PencilSimple
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import type { PortfolioAsset } from '@/types'

interface PortfolioCardProps {
  asset: PortfolioAsset
  onEdit?: () => void
  onDelete?: () => void
  animationDelay?: number
}

export function PortfolioCard({
  asset,
  onEdit,
  onDelete,
  animationDelay = 0,
}: PortfolioCardProps) {
  const isPositive = asset.profitLossPercent >= 0
  const TrendIcon = isPositive ? TrendUp : TrendDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <Card variant="glass" hover className="group">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {asset.image ? (
              <Image
                src={asset.image}
                alt={asset.name}
                width={48}
                height={48}
                className="rounded-xl"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-emerald/30 to-accent-gold/30 flex items-center justify-center">
                <span className="font-display font-bold text-lg text-text-primary">
                  {asset.symbol.slice(0, 2)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-display font-semibold text-text-primary">
                {asset.name}
              </h3>
              <p className="text-sm text-text-muted font-mono">{asset.symbol}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              className="text-text-muted hover:text-accent-emerald"
            >
              <PencilSimple weight="bold" className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="text-text-muted hover:text-price-down"
            >
              <Trash weight="bold" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Holdings */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted mb-1">Quantidade</p>
            <p className="font-mono text-lg font-bold text-text-primary tabular-nums">
              {formatNumber(asset.quantity, 4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Preço Médio</p>
            <p className="font-mono text-lg font-bold text-text-primary tabular-nums">
              {formatCurrency(asset.averagePrice)}
            </p>
          </div>
        </div>

        {/* Value and P/L */}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Valor Atual</span>
            <span className="font-mono text-xl font-bold text-text-primary">
              {formatCurrency(asset.currentValue)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Lucro/Prejuízo</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isPositive ? 'success' : 'danger'}
              >
                <TrendIcon weight="bold" className="w-3 h-3 mr-1" />
                {formatPercent(asset.profitLossPercent)}
              </Badge>
              <span 
                className={cn(
                  'font-mono text-sm',
                  isPositive ? 'text-price-up' : 'text-price-down'
                )}
              >
                {isPositive ? '+' : ''}{formatCurrency(asset.profitLoss)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Price */}
        <div className="mt-4 p-3 rounded-xl bg-background-tertiary/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Preço Atual</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-text-primary">
                {formatCurrency(asset.currentPrice)}
              </span>
              <span 
                className={cn(
                  'text-xs font-mono',
                  asset.priceChangePercent24h >= 0 ? 'text-price-up' : 'text-price-down'
                )}
              >
                {formatPercent(asset.priceChangePercent24h)} 24h
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
