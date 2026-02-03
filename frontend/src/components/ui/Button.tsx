'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-display font-medium rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent-emerald/50 focus:ring-offset-2 focus:ring-offset-background-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm gap-1.5',
          size === 'md' && 'px-5 py-2.5 text-sm gap-2',
          size === 'lg' && 'px-6 py-3 text-base gap-2',
          size === 'icon' && 'p-2.5',
          // Variants
          variant === 'primary' && [
            'bg-gradient-to-r from-accent-emerald to-accent-emerald-dark text-background-primary',
            'hover:shadow-glow-emerald hover:-translate-y-0.5',
            'active:translate-y-0'
          ],
          variant === 'secondary' && [
            'bg-background-tertiary text-text-primary border border-border-subtle',
            'hover:bg-background-elevated hover:border-border-medium',
            'active:bg-background-tertiary'
          ],
          variant === 'ghost' && [
            'bg-transparent text-text-secondary',
            'hover:bg-white/5 hover:text-text-primary',
          ],
          variant === 'danger' && [
            'bg-price-down/15 text-price-down border border-price-down/30',
            'hover:bg-price-down/25 hover:border-price-down/50',
          ],
          variant === 'outline' && [
            'bg-transparent text-accent-emerald border border-accent-emerald/30',
            'hover:bg-accent-emerald/10 hover:border-accent-emerald/50',
          ],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Carregando...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
