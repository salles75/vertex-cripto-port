'use client'

import { 
  TrendUp, 
  TrendDown, 
  Minus,
  ChartLine,
  Target,
  Gauge,
  Info
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn, formatCurrency } from '@/lib/utils'
import type { PredictionData } from '@/types'

interface PredictionCardProps {
  prediction: PredictionData
  isLoading?: boolean
}

export function PredictionCard({ prediction, isLoading = false }: PredictionCardProps) {
  const getTrendInfo = () => {
    switch (prediction.trend) {
      case 'bullish':
        return { 
          icon: TrendUp, 
          label: 'Alta', 
          color: 'text-price-up', 
          bg: 'bg-price-up/15',
          description: 'Tendência de alta identificada'
        }
      case 'bearish':
        return { 
          icon: TrendDown, 
          label: 'Baixa', 
          color: 'text-price-down', 
          bg: 'bg-price-down/15',
          description: 'Tendência de baixa identificada'
        }
      default:
        return { 
          icon: Minus, 
          label: 'Neutro', 
          color: 'text-accent-gold', 
          bg: 'bg-accent-gold/15',
          description: 'Mercado sem tendência clara'
        }
    }
  }

  const getPredictionInfo = () => {
    switch (prediction.prediction.shortTerm) {
      case 'up':
        return { icon: TrendUp, label: 'Subir', color: 'text-price-up' }
      case 'down':
        return { icon: TrendDown, label: 'Cair', color: 'text-price-down' }
      default:
        return { icon: Minus, label: 'Estável', color: 'text-accent-gold' }
    }
  }

  const trendInfo = getTrendInfo()
  const predictionInfo = getPredictionInfo()
  const TrendIcon = trendInfo.icon
  const PredictionIcon = predictionInfo.icon

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-24 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      {/* Background glow */}
      <div 
        className={cn(
          'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20',
          prediction.trend === 'bullish' && 'bg-price-up',
          prediction.trend === 'bearish' && 'bg-price-down',
          prediction.trend === 'neutral' && 'bg-accent-gold'
        )}
      />

      <CardHeader
        action={
          <Badge variant={prediction.trend === 'bullish' ? 'success' : prediction.trend === 'bearish' ? 'danger' : 'warning'}>
            <TrendIcon weight="bold" className="w-4 h-4 mr-1" />
            {trendInfo.label}
          </Badge>
        }
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', trendInfo.bg)}>
            <ChartLine weight="duotone" className={cn('w-5 h-5', trendInfo.color)} />
          </div>
          <div>
            <CardTitle>Análise Técnica</CardTitle>
            <p className="text-sm text-text-muted">{prediction.symbol}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Prediction Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'p-4 rounded-xl border',
            prediction.prediction.shortTerm === 'up' && 'bg-price-up/10 border-price-up/30',
            prediction.prediction.shortTerm === 'down' && 'bg-price-down/10 border-price-down/30',
            prediction.prediction.shortTerm === 'stable' && 'bg-accent-gold/10 border-accent-gold/30'
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Previsão de Curto Prazo</p>
              <div className="flex items-center gap-2">
                <PredictionIcon weight="bold" className={cn('w-6 h-6', predictionInfo.color)} />
                <span className={cn('text-xl font-display font-bold', predictionInfo.color)}>
                  Tendência a {predictionInfo.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted mb-1">Confiança</p>
              <div className="flex items-center gap-2">
                <Gauge weight="duotone" className="w-5 h-5 text-text-secondary" />
                <span className="font-mono text-lg font-bold text-text-primary">
                  {Math.round(prediction.prediction.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mt-3 h-2 rounded-full bg-background-primary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.prediction.confidence * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                prediction.prediction.shortTerm === 'up' && 'bg-price-up',
                prediction.prediction.shortTerm === 'down' && 'bg-price-down',
                prediction.prediction.shortTerm === 'stable' && 'bg-accent-gold'
              )}
            />
          </div>
        </motion.div>

        {/* Moving Averages */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <ChartLine weight="duotone" className="w-4 h-4" />
            Médias Móveis
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'SMA 7', value: prediction.sma7 },
              { label: 'SMA 14', value: prediction.sma14 },
              { label: 'SMA 30', value: prediction.sma30 },
              { label: 'EMA 7', value: prediction.ema7 },
            ].map((ma) => (
              <div 
                key={ma.label}
                className="p-3 rounded-lg bg-background-tertiary/50"
              >
                <p className="text-xs text-text-muted mb-1">{ma.label}</p>
                <p className="font-mono text-sm font-medium text-text-primary">
                  {formatCurrency(ma.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Support & Resistance */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Target weight="duotone" className="w-4 h-4" />
            Suporte & Resistência
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-price-up/10 border border-price-up/20">
              <p className="text-xs text-price-up mb-1">Resistência</p>
              <p className="font-mono text-sm font-medium text-text-primary">
                {formatCurrency(prediction.resistance)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-price-down/10 border border-price-down/20">
              <p className="text-xs text-price-down mb-1">Suporte</p>
              <p className="font-mono text-sm font-medium text-text-primary">
                {formatCurrency(prediction.support)}
              </p>
            </div>
          </div>
        </div>

        {/* RSI */}
        {prediction.rsi !== undefined && (
          <div className="p-3 rounded-lg bg-background-tertiary/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">RSI (14)</span>
              <span 
                className={cn(
                  'font-mono text-lg font-bold',
                  prediction.rsi > 70 && 'text-price-down',
                  prediction.rsi < 30 && 'text-price-up',
                  prediction.rsi >= 30 && prediction.rsi <= 70 && 'text-text-primary'
                )}
              >
                {prediction.rsi.toFixed(1)}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-gradient-to-r from-price-up via-accent-gold to-price-down">
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-background-primary shadow-lg"
                style={{ left: `${prediction.rsi}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-text-muted">
              <span>Sobrevendido</span>
              <span>Sobrecomprado</span>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
          <Info weight="fill" className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted">
            Esta análise é baseada em indicadores técnicos e não constitui recomendação de investimento. 
            Faça sua própria pesquisa antes de tomar decisões.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
