'use client'

import { 
  ArrowSquareOut, 
  TrendUp, 
  TrendDown, 
  Minus,
  Clock 
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { NewsArticle } from '@/types'

interface NewsCardProps {
  article: NewsArticle
  variant?: 'default' | 'compact' | 'featured'
  animationDelay?: number
}

export function NewsCard({
  article,
  variant = 'default',
  animationDelay = 0,
}: NewsCardProps) {
  const getSentimentIcon = () => {
    switch (article.sentiment) {
      case 'positive':
        return <TrendUp weight="bold" className="w-4 h-4" />
      case 'negative':
        return <TrendDown weight="bold" className="w-4 h-4" />
      default:
        return <Minus weight="bold" className="w-4 h-4" />
    }
  }

  const getSentimentVariant = () => {
    switch (article.sentiment) {
      case 'positive':
        return 'success'
      case 'negative':
        return 'danger'
      default:
        return 'outline'
    }
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: animationDelay }}
      >
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 rounded-xl hover:bg-white/5 transition-all group"
        >
          <div className="flex items-start gap-3">
            <Badge variant={getSentimentVariant()} size="sm" className="mt-0.5">
              {getSentimentIcon()}
            </Badge>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent-emerald transition-colors">
                {article.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-text-muted">{article.source}</span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock weight="bold" className="w-3 h-3" />
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </div>
            </div>
            <ArrowSquareOut 
              weight="duotone" 
              className="w-4 h-4 text-text-muted group-hover:text-accent-emerald transition-colors flex-shrink-0" 
            />
          </div>
        </a>
      </motion.div>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: animationDelay }}
      >
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <Card variant="glass" hover className="relative overflow-hidden">
            {/* Background gradient based on sentiment */}
            <div 
              className={cn(
                'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10',
                article.sentiment === 'positive' && 'bg-price-up',
                article.sentiment === 'negative' && 'bg-price-down',
                article.sentiment === 'neutral' && 'bg-accent-gold'
              )}
            />

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={getSentimentVariant()}>
                  {getSentimentIcon()}
                  <span className="ml-1 capitalize">{article.sentiment || 'Neutro'}</span>
                </Badge>
                <ArrowSquareOut 
                  weight="duotone" 
                  className="w-5 h-5 text-text-muted group-hover:text-accent-emerald transition-colors" 
                />
              </div>

              <h3 className="font-display text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-emerald transition-colors line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm text-text-secondary line-clamp-3 mb-4">
                {article.description}
              </p>

              {/* Related assets */}
              {article.relatedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.relatedAssets.slice(0, 5).map((asset) => (
                    <span
                      key={asset}
                      className="px-2 py-1 rounded-md bg-accent-emerald/10 text-accent-emerald text-xs font-mono"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <span className="text-sm text-text-muted">{article.source}</span>
                <span className="text-sm text-text-muted flex items-center gap-1">
                  <Clock weight="bold" className="w-4 h-4" />
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </div>
            </div>
          </Card>
        </a>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <Card variant="default" hover padding="md">
          <div className="flex items-start gap-4">
            {/* Sentiment indicator bar */}
            <div 
              className={cn(
                'w-1 self-stretch rounded-full flex-shrink-0',
                article.sentiment === 'positive' && 'bg-price-up',
                article.sentiment === 'negative' && 'bg-price-down',
                article.sentiment === 'neutral' && 'bg-accent-gold'
              )}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getSentimentVariant()} size="sm">
                  {getSentimentIcon()}
                </Badge>
                <span className="text-xs text-text-muted">{article.source}</span>
              </div>

              <h3 className="font-display font-semibold text-text-primary mb-2 group-hover:text-accent-emerald transition-colors line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                {article.description}
              </p>

              <div className="flex items-center justify-between">
                {article.relatedAssets.length > 0 ? (
                  <div className="flex items-center gap-1">
                    {article.relatedAssets.slice(0, 3).map((asset) => (
                      <span
                        key={asset}
                        className="px-2 py-0.5 rounded bg-white/5 text-xs font-mono text-text-muted"
                      >
                        {asset}
                      </span>
                    ))}
                    {article.relatedAssets.length > 3 && (
                      <span className="text-xs text-text-muted">
                        +{article.relatedAssets.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <span />
                )}

                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock weight="bold" className="w-3 h-3" />
                  {formatRelativeTime(article.publishedAt)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </a>
    </motion.div>
  )
}
