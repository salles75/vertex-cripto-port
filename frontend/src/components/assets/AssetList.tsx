'use client'

import { useState } from 'react'
import { 
  CaretUp, 
  CaretDown, 
  FunnelSimple,
  Rows,
  SquaresFour
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetCard, AssetCardCompact } from './AssetCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Asset } from '@/types'

type SortField = 'name' | 'price' | 'change' | 'volume' | 'marketCap'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface AssetListProps {
  assets: Asset[]
  title?: string
  onAssetClick?: (asset: Asset) => void
  watchlist?: string[]
  onWatchlistToggle?: (assetId: string) => void
  showViewToggle?: boolean
  defaultView?: ViewMode
}

export function AssetList({
  assets,
  title = 'Ativos',
  onAssetClick,
  watchlist = [],
  onWatchlistToggle,
  showViewToggle = true,
  defaultView = 'grid',
}: AssetListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showFilters, setShowFilters] = useState(false)

  const sortedAssets = [...assets].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'price':
        comparison = a.currentPrice - b.currentPrice
        break
      case 'change':
        comparison = a.priceChangePercent24h - b.priceChangePercent24h
        break
      case 'volume':
        comparison = a.volume24h - b.volume24h
        break
      case 'marketCap':
        comparison = (a.marketCap || 0) - (b.marketCap || 0)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all',
        sortField === field
          ? 'bg-accent-emerald/15 text-accent-emerald'
          : 'text-text-muted hover:text-text-primary hover:bg-white/5'
      )}
    >
      {label}
      {sortField === field && (
        sortDirection === 'asc' ? (
          <CaretUp weight="bold" className="w-3 h-3" />
        ) : (
          <CaretDown weight="bold" className="w-3 h-3" />
        )
      )}
    </button>
  )

  return (
    <Card variant="default" padding="lg">
      <CardHeader
        action={
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-white/5')}
            >
              <FunnelSimple weight="duotone" className="w-4 h-4" />
            </Button>

            {/* View mode toggle */}
            {showViewToggle && (
              <div className="flex items-center bg-background-tertiary rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'grid' 
                      ? 'bg-accent-emerald/15 text-accent-emerald' 
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <SquaresFour weight="bold" className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'list' 
                      ? 'bg-accent-emerald/15 text-accent-emerald' 
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <Rows weight="bold" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        }
      >
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      {/* Sort options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-background-tertiary/50">
              <span className="text-sm text-text-muted py-1.5">Ordenar por:</span>
              <SortButton field="marketCap" label="Market Cap" />
              <SortButton field="price" label="Preço" />
              <SortButton field="change" label="Variação" />
              <SortButton field="volume" label="Volume" />
              <SortButton field="name" label="Nome" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedAssets.map((asset, index) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => onAssetClick?.(asset)}
              onWatchlistToggle={() => onWatchlistToggle?.(asset.id)}
              isWatchlisted={watchlist.includes(asset.id)}
              animationDelay={index * 0.05}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {sortedAssets.map((asset, index) => (
            <AssetCardCompact
              key={asset.id}
              asset={asset}
              onClick={() => onAssetClick?.(asset)}
              animationDelay={index * 0.03}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {assets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">Nenhum ativo encontrado</p>
        </div>
      )}
    </Card>
  )
}
