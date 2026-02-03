'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlass, Funnel, ArrowClockwise, Newspaper } from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NewsCard } from '@/components/news/NewsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { NewsArticle } from '@/types'

type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral'

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')
  const [assetFilter, setAssetFilter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sentimentData, setSentimentData] = useState<{
    counts: { positive: number; negative: number; neutral: number }
    score: number
    overall: string
  } | null>(null)

  // Busca notícias da API
  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    try {
      const [newsData, sentiment] = await Promise.all([
        api.getNews(50),
        api.getSentimentAnalysis(),
      ])
      setNews(newsData)
      setSentimentData(sentiment)
    } catch (error) {
      console.error('Erro ao carregar notícias:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Get unique assets from news
  const uniqueAssets = Array.from(
    new Set(news.flatMap((n) => n.relatedAssets))
  ).sort()

  // Filter news
  const filteredNews = news.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSentiment =
      sentimentFilter === 'all' || article.sentiment === sentimentFilter

    const matchesAsset =
      !assetFilter || article.relatedAssets.includes(assetFilter)

    return matchesSearch && matchesSentiment && matchesAsset
  })

  // Sentiment stats
  const sentimentStats = sentimentData?.counts || {
    positive: news.filter((n) => n.sentiment === 'positive').length,
    negative: news.filter((n) => n.sentiment === 'negative').length,
    neutral: news.filter((n) => n.sentiment === 'neutral').length,
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
              className="text-3xl font-display font-bold text-text-primary"
            >
              Notícias
            </motion.h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-text-muted">
                Acompanhe as últimas notícias do mercado
              </p>
              <Badge variant="success" size="sm">
                <span className="w-2 h-2 bg-price-up rounded-full animate-pulse mr-1.5" />
                {news.length} notícias
              </Badge>
            </div>
          </div>

          <Button variant="secondary" onClick={fetchNews} disabled={isLoading}>
            <ArrowClockwise weight="bold" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Search */}
            <Card variant="default" padding="md">
              <div className="relative">
                <MagnifyingGlass
                  weight="duotone"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Buscar notícias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-glass pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </Card>

            {/* Sentiment Filter */}
            <Card variant="default" padding="md">
              <h3 className="font-display font-semibold text-sm text-text-primary mb-3 flex items-center gap-2">
                <Funnel weight="duotone" className="w-4 h-4" />
                Sentimento
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todas', count: news.length },
                  { value: 'positive', label: 'Positivas', count: sentimentStats.positive },
                  { value: 'neutral', label: 'Neutras', count: sentimentStats.neutral },
                  { value: 'negative', label: 'Negativas', count: sentimentStats.negative },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSentimentFilter(option.value as SentimentFilter)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                      sentimentFilter === option.value
                        ? 'bg-accent-emerald/15 text-accent-emerald'
                        : 'text-text-secondary hover:bg-white/5'
                    )}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs opacity-60">{option.count}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Asset Filter */}
            <Card variant="default" padding="md">
              <h3 className="font-display font-semibold text-sm text-text-primary mb-3">
                Por Ativo
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={assetFilter === null ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setAssetFilter(null)}
                >
                  Todos
                </Button>
                {uniqueAssets.slice(0, 10).map((asset) => (
                  <Button
                    key={asset}
                    variant={assetFilter === asset ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setAssetFilter(asset)}
                  >
                    {asset}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Sentiment Summary */}
            <Card variant="glass" padding="md">
              <h3 className="font-display font-semibold text-sm text-text-primary mb-3">
                Resumo do Mercado
              </h3>
              <div className="h-3 rounded-full bg-background-primary overflow-hidden flex mb-3">
                <motion.div
                  className="h-full bg-price-up"
                  initial={{ width: 0 }}
                  animate={{ width: news.length > 0 ? `${(sentimentStats.positive / news.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="h-full bg-accent-gold"
                  initial={{ width: 0 }}
                  animate={{ width: news.length > 0 ? `${(sentimentStats.neutral / news.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                <motion.div
                  className="h-full bg-price-down"
                  initial={{ width: 0 }}
                  animate={{ width: news.length > 0 ? `${(sentimentStats.negative / news.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-price-up">Positivas</span>
                  <span className="text-text-muted">{sentimentStats.positive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-accent-gold">Neutras</span>
                  <span className="text-text-muted">{sentimentStats.neutral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-price-down">Negativas</span>
                  <span className="text-text-muted">{sentimentStats.negative}</span>
                </div>
              </div>
              {sentimentData && (
                <div className="mt-3 pt-3 border-t border-border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Score geral</span>
                    <Badge 
                      variant={
                        sentimentData.overall === 'positive' ? 'success' :
                        sentimentData.overall === 'negative' ? 'danger' : 'warning'
                      }
                      size="sm"
                    >
                      {sentimentData.overall === 'positive' ? 'Otimista' :
                       sentimentData.overall === 'negative' ? 'Pessimista' : 'Neutro'}
                    </Badge>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Main Content - News List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper weight="duotone" className="w-5 h-5 text-accent-emerald" />
                    {filteredNews.length} Notícias
                    {sentimentFilter !== 'all' && (
                      <Badge variant="info" size="sm" className="ml-2">
                        {sentimentFilter}
                      </Badge>
                    )}
                    {assetFilter && (
                      <Badge variant="warning" size="sm" className="ml-2">
                        {assetFilter}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : filteredNews.length > 0 ? (
                  <div className="space-y-4">
                    {/* Featured News */}
                    {filteredNews.slice(0, 2).map((article, index) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        variant="featured"
                        animationDelay={index * 0.1}
                      />
                    ))}

                    {/* Regular News */}
                    {filteredNews.length > 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {filteredNews.slice(2).map((article, index) => (
                          <NewsCard
                            key={article.id}
                            article={article}
                            variant="default"
                            animationDelay={(index + 2) * 0.05}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Newspaper weight="duotone" className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">Nenhuma notícia encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
