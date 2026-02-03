'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ChartLineUp, 
  Newspaper, 
  Wallet, 
  MagnifyingGlass,
  Bell,
  Gear,
  List
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartLineUp },
  { name: 'Mercado', href: '/mercado', icon: ChartLineUp },
  { name: 'Portfólio', href: '/portfolio', icon: Wallet },
  { name: 'Notícias', href: '/noticias', icon: Newspaper },
]

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background-primary/80 backdrop-blur-xl border-b border-border-subtle" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-emerald to-accent-gold flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <ChartLineUp weight="bold" className="w-6 h-6 text-background-primary" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-accent-emerald to-accent-gold rounded-xl opacity-30 blur group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary tracking-tight">
              Vertex
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                <item.icon weight="duotone" className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                'p-2 rounded-lg transition-all',
                'text-text-secondary hover:text-text-primary hover:bg-white/5',
                isSearchOpen && 'bg-white/5 text-text-primary'
              )}
            >
              <MagnifyingGlass weight="duotone" className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all relative">
              <Bell weight="duotone" className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">
              <Gear weight="duotone" className="w-5 h-5" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <List weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 px-4 pb-4 animate-fade-in">
            <div className="relative">
              <MagnifyingGlass 
                weight="duotone" 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" 
              />
              <input
                type="text"
                placeholder="Buscar ativos, notícias..."
                className="input-glass pl-12 pr-4"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-background-secondary/95 backdrop-blur-xl border-b border-border-subtle animate-slide-up">
            <nav className="px-4 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
                >
                  <item.icon weight="duotone" className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
