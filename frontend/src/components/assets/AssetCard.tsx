'use client'

import Image from 'next/image'
import { 
  TrendUp, 
  TrendDown, 
  Star, 
  DotsThreeOutlineVertical 
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import type { Asset } from '@/types'

interface AssetCardProps {
  asset: Asset
  onClick?: () => void
  onWatchlistToggle?: () => void
  isWatchlisted?: boolean
  showDetails?: boolean
  animationDelay?: number
}

export function AssetCard({
  asset,
  onClick,
  onWatchlistToggle,
  isWatchlisted = false,
  showDetails = true,
  animationDelay = 0,
}: AssetCardProps) {
  const isPositive = asset.priceChangePercent24h >= 0
  const TrendIcon = isPositive ? TrendUp : TrendDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <Card 
        variant="glass" 
        hover 
        className="group"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          {/* Asset Info */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative">
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
              {/* Type indicator */}
              <div 
                className={cn(
                  'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  asset.type === 'crypto' 
                    ? 'bg-accent-emerald text-background-primary' 
                    : 'bg-accent-gold text-background-primary'
                )}
              >
                {asset.type === 'crypto' ? '₿' : '$'}
              </div>
            </div>

            {/* Name & Symbol */}
            <div>
              <h3 className="font-display font-semibold text-text-primary group-hover:text-accent-emerald transition-colors">
                {asset.name}
              </h3>
              <p className="text-sm text-text-muted font-mono">
                {asset.symbol}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onWatchlistToggle?.()
              }}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                isWatchlisted 
                  ? 'text-accent-gold bg-accent-gold/10' 
                  : 'text-text-muted hover:text-accent-gold hover:bg-accent-gold/10'
              )}
            >
              <Star weight={isWatchlisted ? 'fill' : 'regular'} className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <DotsThreeOutlineVertical weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price Section */}
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="font-mono text-2xl font-bold text-text-primary tabular-nums">
              {formatCurrency(asset.currentPrice)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={isPositive ? 'success' : 'danger'} 
                size="sm"
              >
                <TrendIcon weight="bold" className="w-3 h-3 mr-1" />
                {formatPercent(asset.priceChangePercent24h)}
              </Badge>
              <span className="text-xs text-text-muted">
                24h
              </span>
            </div>
          </div>

          {/* Mini trend indicator */}
          <div 
            className={cn(
              'w-16 h-8 rounded-lg flex items-center justify-center',
              isPositive ? 'bg-price-up/10' : 'bg-price-down/10'
            )}
          >
            <TrendIcon 
              weight="bold" 
              className={cn(
                'w-6 h-6',
                isPositive ? 'text-price-up' : 'text-price-down'
              )} 
            />
          </div>
        </div>

        {/* Extra Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Volume 24h</p>
              <p className="font-mono text-sm text-text-secondary tabular-nums">
                ${formatNumber(asset.volume24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Alta 24h</p>
              <p className="font-mono text-sm text-price-up tabular-nums">
                {formatCurrency(asset.high24h)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Baixa 24h</p>
              <p className="font-mono text-sm text-price-down tabular-nums">
                {formatCurrency(asset.low24h)}
              </p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// Compact version for lists
export function AssetCardCompact({
  asset,
  onClick,
  animationDelay = 0,
}: Omit<AssetCardProps, 'showDetails'>) {
  const isPositive = asset.priceChangePercent24h >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
    >
      <div 
        onClick={onClick}
        className={cn(
          'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all',
          'hover:bg-white/5 group'
        )}
      >
        <div className="flex items-center gap-3">
          {asset.image ? (
            <Image
              src={asset.image}
              alt={asset.name}
              width={36}
              height={36}
              className="rounded-lg"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-emerald/30 to-accent-gold/30 flex items-center justify-center">
              <span className="font-display font-semibold text-sm text-text-primary">
                {asset.symbol.slice(0, 2)}
              </span>
            </div>
          )}
          
          <div>
            <p className="font-display font-medium text-sm text-text-primary group-hover:text-accent-emerald transition-colors">
              {asset.name}
            </p>
            <p className="text-xs text-text-muted font-mono">{asset.symbol}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-text-primary tabular-nums">
            {formatCurrency(asset.currentPrice)}
          </p>
          <p 
            className={cn(
              'text-xs font-mono tabular-nums',
              isPositive ? 'text-price-up' : 'text-price-down'
            )}
          >
            {formatPercent(asset.priceChangePercent24h)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
