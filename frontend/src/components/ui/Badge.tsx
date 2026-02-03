'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap',
          // Sizes
          size === 'sm' && 'px-2 py-0.5 text-xs',
          size === 'md' && 'px-2.5 py-1 text-sm',
          size === 'lg' && 'px-3 py-1.5 text-sm',
          // Variants
          variant === 'default' && 'bg-white/10 text-text-primary',
          variant === 'success' && 'bg-price-up/15 text-price-up',
          variant === 'danger' && 'bg-price-down/15 text-price-down',
          variant === 'warning' && 'bg-accent-gold/15 text-accent-gold',
          variant === 'info' && 'bg-accent-emerald/15 text-accent-emerald',
          variant === 'outline' && 'bg-transparent border border-border-medium text-text-secondary',
          // Pulse animation
          pulse && 'animate-pulse-slow',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
