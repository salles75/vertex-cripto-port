'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { PriceHistoryPoint } from '@/types'

type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'MAX'

interface PriceChartProps {
  data: PriceHistoryPoint[]
  symbol: string
  currentPrice?: number
  isLoading?: boolean
  onRangeChange?: (range: TimeRange) => void
}

const timeRanges: TimeRange[] = ['1D', '7D', '1M', '3M', '1Y', 'MAX']

export function PriceChart({
  data,
  symbol,
  currentPrice,
  isLoading = false,
  onRangeChange,
}: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7D')
  const [hoveredData, setHoveredData] = useState<{ price: number; date: string } | null>(null)

  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      timestamp: new Date(point.timestamp).getTime(),
      formattedDate: formatDate(point.timestamp, { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }),
    }))
  }, [data])

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { value: 0, percent: 0 }
    const first = chartData[0].price
    const last = chartData[chartData.length - 1].price
    const value = last - first
    const percent = (value / first) * 100
    return { value, percent }
  }, [chartData])

  const isPositive = priceChange.percent >= 0
  const gradientId = `gradient-${symbol}`
  const gradientColor = isPositive ? '#22c55e' : '#ef4444'

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range)
    onRangeChange?.(range)
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="glass-card p-3 shadow-lg">
          <p className="text-xs text-text-muted mb-1">{point.formattedDate}</p>
          <p className="font-mono text-lg font-bold text-text-primary">
            {formatCurrency(point.price)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      {/* Background glow effect - pointer-events-none para não bloquear cliques */}
      <div 
        className={cn(
          'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none',
          isPositive ? 'bg-price-up' : 'bg-price-down'
        )}
      />

      <CardHeader
        action={
          <div className="flex items-center bg-background-tertiary/50 rounded-lg p-1 relative z-10">
            {timeRanges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleRangeChange(range)}
                className={cn(
                  'px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer select-none',
                  'min-w-[44px] flex items-center justify-center',
                  selectedRange === range
                    ? 'bg-accent-emerald text-background-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        }
      >
        <div className="relative z-10">
          <CardTitle>{symbol} Price</CardTitle>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-2xl font-bold text-text-primary">
              {formatCurrency(hoveredData?.price ?? currentPrice ?? chartData[chartData.length - 1]?.price ?? 0)}
            </span>
            <span 
              className={cn(
                'text-sm font-mono',
                isPositive ? 'text-price-up' : 'text-price-down'
              )}
            >
              {isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-emerald border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-text-muted text-sm">Nenhum dado disponível para este período</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-[300px] mt-4 relative z-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setHoveredData({
                    price: e.activePayload[0].payload.price,
                    date: e.activePayload[0].payload.formattedDate,
                  })
                }
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.05)" 
                vertical={false}
              />
              
              <XAxis
                dataKey="formattedDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7872', fontSize: 11 }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const parts = value.split(' ')
                  return parts.slice(0, 2).join(' ')
                }}
              />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7872', fontSize: 11 }}
                tickMargin={10}
                tickFormatter={(value) => formatCurrency(value)}
                domain={['auto', 'auto']}
                width={80}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="price"
                stroke={gradientColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Stats footer */}
      <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-4 gap-4 relative z-10">
        <div>
          <p className="text-xs text-text-muted">Mínimo</p>
          <p className="font-mono text-sm text-text-secondary">
            {chartData.length > 0 ? formatCurrency(Math.min(...chartData.map(d => d.price))) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Máximo</p>
          <p className="font-mono text-sm text-text-secondary">
            {chartData.length > 0 ? formatCurrency(Math.max(...chartData.map(d => d.price))) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Média</p>
          <p className="font-mono text-sm text-text-secondary">
            {chartData.length > 0 ? formatCurrency(chartData.reduce((a, b) => a + b.price, 0) / chartData.length) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Variação</p>
          <p className={cn(
            'font-mono text-sm',
            isPositive ? 'text-price-up' : 'text-price-down'
          )}>
            {formatCurrency(Math.abs(priceChange.value))}
          </p>
        </div>
      </div>
    </Card>
  )
}
