'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  ChartLineUp,
  Wallet,
  Newspaper,
  Gear,
  Star,
  TrendUp,
  Bell,
  Question,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: House },
  { name: 'Mercado', href: '/mercado', icon: ChartLineUp },
  { name: 'Portfólio', href: '/portfolio', icon: Wallet },
  { name: 'Notícias', href: '/noticias', icon: Newspaper },
]

const secondaryNavigation = [
  { name: 'Watchlist', href: '/watchlist', icon: Star },
  { name: 'Análises', href: '/analises', icon: TrendUp },
]

const utilityNavigation = [
  { name: 'Notificações', href: '/notificacoes', icon: Bell },
  { name: 'Configurações', href: '/configuracoes', icon: Gear },
  { name: 'Ajuda', href: '/ajuda', icon: Question },
]

export function Sidebar() {
  const pathname = usePathname()

  const NavLink = ({ 
    item, 
    compact = false 
  }: { 
    item: { name: string; href: string; icon: typeof House }
    compact?: boolean 
  }) => {
    const isActive = pathname === item.href

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-accent-emerald/15 text-accent-emerald'
            : 'text-text-secondary hover:text-text-primary hover:bg-white/5',
          compact && 'justify-center px-2'
        )}
      >
        <item.icon 
          weight={isActive ? 'fill' : 'duotone'} 
          className={cn(
            'w-5 h-5 flex-shrink-0',
            isActive && 'text-accent-emerald'
          )} 
        />
        {!compact && <span>{item.name}</span>}
      </Link>
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-background-secondary/50 border-r border-border-subtle">
      {/* Logo area */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-emerald to-accent-gold flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <ChartLineUp weight="bold" className="w-6 h-6 text-background-primary" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-accent-emerald to-accent-gold rounded-xl opacity-20 blur group-hover:opacity-40 transition-opacity" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-text-primary tracking-tight">
              Vertex
            </span>
            <p className="text-xs text-text-muted">Asset Manager</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Principal
          </p>
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Análise
          </p>
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border-subtle">
        <div className="space-y-1">
          {utilityNavigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        {/* Status indicator */}
        <div className="mt-4 p-3 rounded-xl bg-background-tertiary">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
            <span className="text-xs font-medium text-text-secondary">Sistema Online</span>
          </div>
          <p className="text-xs text-text-muted">
            Dados em tempo real ativos
          </p>
        </div>
      </div>
    </aside>
  )
}
