'use client'

import { useState } from 'react'
import { 
  Newspaper, 
  TrendUp, 
  TrendDown, 
  Equals,
  ArrowRight
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { NewsCard } from './NewsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { NewsArticle } from '@/types'

type FilterType = 'all' | 'positive' | 'negative' | 'neutral'

interface NewsFeedProps {
  news: NewsArticle[]
  title?: string
  showFilters?: boolean
  showSentimentSummary?: boolean
  maxItems?: number
  onViewAll?: () => void
}

export function NewsFeed({
  news,
  title = 'Últimas Notícias',
  showFilters = true,
  showSentimentSummary = true,
  maxItems,
  onViewAll,
}: NewsFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const sentimentCounts = {
    positive: news.filter((n) => n.sentiment === 'positive').length,
    negative: news.filter((n) => n.sentiment === 'negative').length,
    neutral: news.filter((n) => n.sentiment === 'neutral').length,
  }

  const filteredNews = news.filter((article) => {
    if (filter === 'all') return true
    return article.sentiment === filter
  })

  const displayedNews = maxItems ? filteredNews.slice(0, maxItems) : filteredNews

  const overallSentiment = sentimentCounts.positive > sentimentCounts.negative 
    ? 'positive' 
    : sentimentCounts.negative > sentimentCounts.positive 
      ? 'negative' 
      : 'neutral'

  return (
    <Card variant="default" padding="lg">
      <CardHeader
        action={
          onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Ver todas
              <ArrowRight weight="bold" className="w-4 h-4" />
            </Button>
          )
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-emerald/15">
            <Newspaper weight="duotone" className="w-5 h-5 text-accent-emerald" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>

      {/* Sentiment Summary */}
      {showSentimentSummary && (
        <div className="mb-4 p-4 rounded-xl bg-background-tertiary/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">Sentimento do Mercado</span>
            <Badge 
              variant={
                overallSentiment === 'positive' ? 'success' :
                overallSentiment === 'negative' ? 'danger' : 'warning'
              }
            >
              {overallSentiment === 'positive' && <TrendUp weight="bold" className="w-3 h-3 mr-1" />}
              {overallSentiment === 'negative' && <TrendDown weight="bold" className="w-3 h-3 mr-1" />}
              {overallSentiment === 'neutral' && <Equals weight="bold" className="w-3 h-3 mr-1" />}
              <span className="capitalize">{overallSentiment === 'positive' ? 'Positivo' : overallSentiment === 'negative' ? 'Negativo' : 'Neutro'}</span>
            </Badge>
          </div>
          
          {/* Sentiment bar */}
          <div className="h-2 rounded-full bg-background-primary overflow-hidden flex">
            <motion.div 
              className="h-full bg-price-up"
              initial={{ width: 0 }}
              animate={{ width: `${(sentimentCounts.positive / news.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <motion.div 
              className="h-full bg-accent-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(sentimentCounts.neutral / news.length) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            <motion.div 
              className="h-full bg-price-down"
              initial={{ width: 0 }}
              animate={{ width: `${(sentimentCounts.negative / news.length) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs">
            <span className="text-price-up">{sentimentCounts.positive} positivas</span>
            <span className="text-accent-gold">{sentimentCounts.neutral} neutras</span>
            <span className="text-price-down">{sentimentCounts.negative} negativas</span>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'all', label: 'Todas', count: news.length },
            { value: 'positive', label: 'Positivas', count: sentimentCounts.positive, icon: TrendUp },
            { value: 'neutral', label: 'Neutras', count: sentimentCounts.neutral, icon: Equals },
            { value: 'negative', label: 'Negativas', count: sentimentCounts.negative, icon: TrendDown },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as FilterType)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all',
                filter === item.value
                  ? 'bg-accent-emerald/15 text-accent-emerald'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              )}
            >
              {item.icon && <item.icon weight="bold" className="w-3 h-3" />}
              {item.label}
              <span className="text-xs opacity-60">({item.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* News List */}
      <CardContent>
        {displayedNews.length > 0 ? (
          <div className="space-y-3">
            {displayedNews.map((article, index) => (
              <NewsCard
                key={article.id}
                article={article}
                variant="compact"
                animationDelay={index * 0.05}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Newspaper weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">Nenhuma notícia encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
