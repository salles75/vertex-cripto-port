'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Gear,
  Moon,
  Sun,
  Bell,
  Globe,
  CurrencyDollar,
  Palette,
  ShieldCheck,
  Trash,
  Check,
  Export,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

// Tipos para configurações
interface Settings {
  theme: 'dark' | 'light' | 'system'
  currency: 'USD' | 'BRL' | 'EUR'
  language: 'pt-BR' | 'en-US' | 'es-ES'
  notifications: {
    priceAlerts: boolean
    newsAlerts: boolean
    portfolioUpdates: boolean
    emailNotifications: boolean
  }
  display: {
    compactMode: boolean
    showPercentages: boolean
    animationsEnabled: boolean
  }
  privacy: {
    shareAnalytics: boolean
    saveHistory: boolean
  }
}

const defaultSettings: Settings = {
  theme: 'dark',
  currency: 'USD',
  language: 'pt-BR',
  notifications: {
    priceAlerts: true,
    newsAlerts: true,
    portfolioUpdates: true,
    emailNotifications: false,
  },
  display: {
    compactMode: false,
    showPercentages: true,
    animationsEnabled: true,
  },
  privacy: {
    shareAnalytics: false,
    saveHistory: true,
  },
}

// Chave localStorage
const SETTINGS_STORAGE_KEY = 'ativos-financeiros-settings'

const saveSettingsToStorage = (settings: Settings): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }
}

const loadSettingsFromStorage = (): Settings => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) }
      } catch {
        console.error('Erro ao carregar configurações')
      }
    }
  }
  return defaultSettings
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettingsFromStorage())
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    saveSettingsToStorage(updated)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const updateNestedSettings = <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: Settings[K][keyof Settings[K]]
  ) => {
    const updated = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    }
    setSettings(updated)
    saveSettingsToStorage(updated)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
      localStorage.clear()
      setSettings(defaultSettings)
      window.location.reload()
    }
  }

  const handleExportData = () => {
    const data = {
      settings,
      watchlist: localStorage.getItem('ativos-financeiros-watchlist'),
      portfolio: localStorage.getItem('ativos-financeiros-portfolio'),
      alerts: localStorage.getItem('ativos-financeiros-alerts'),
      exportedAt: new Date().toISOString(),
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vertex-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleResetSettings = () => {
    if (confirm('Restaurar configurações padrão?')) {
      setSettings(defaultSettings)
      saveSettingsToStorage(defaultSettings)
    }
  }

  const ToggleSwitch = ({ 
    enabled, 
    onChange 
  }: { 
    enabled: boolean
    onChange: (value: boolean) => void 
  }) => (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        enabled ? 'bg-accent-emerald' : 'bg-white/20'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )

  const OptionButton = ({ 
    selected, 
    onClick, 
    children 
  }: { 
    selected: boolean
    onClick: () => void
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
        selected
          ? 'bg-accent-emerald text-background-primary'
          : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
      )}
    >
      {children}
    </button>
  )

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
              className="text-3xl font-display font-bold text-text-primary flex items-center gap-3"
            >
              <Gear weight="fill" className="w-8 h-8 text-text-secondary" />
              Configurações
            </motion.h1>
            <p className="text-text-muted mt-1">
              Personalize sua experiência
            </p>
          </div>

          {isSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <Badge variant="success">
                <Check weight="bold" className="w-3 h-3 mr-1" />
                Salvo automaticamente
              </Badge>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Aparência */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette weight="duotone" className="w-5 h-5 text-accent-emerald" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tema */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      Tema
                    </label>
                    <div className="flex gap-2">
                      <OptionButton
                        selected={settings.theme === 'dark'}
                        onClick={() => updateSettings({ theme: 'dark' })}
                      >
                        <Moon weight="bold" className="w-4 h-4 inline mr-2" />
                        Escuro
                      </OptionButton>
                      <OptionButton
                        selected={settings.theme === 'light'}
                        onClick={() => updateSettings({ theme: 'light' })}
                      >
                        <Sun weight="bold" className="w-4 h-4 inline mr-2" />
                        Claro
                      </OptionButton>
                      <OptionButton
                        selected={settings.theme === 'system'}
                        onClick={() => updateSettings({ theme: 'system' })}
                      >
                        Sistema
                      </OptionButton>
                    </div>
                  </div>

                  {/* Animações */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Animações</p>
                      <p className="text-xs text-text-muted">Efeitos visuais e transições</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.display.animationsEnabled}
                      onChange={(v) => updateNestedSettings('display', 'animationsEnabled', v)}
                    />
                  </div>

                  {/* Modo compacto */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Modo Compacto</p>
                      <p className="text-xs text-text-muted">Exibe mais informações na tela</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.display.compactMode}
                      onChange={(v) => updateNestedSettings('display', 'compactMode', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Regional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe weight="duotone" className="w-5 h-5 text-accent-gold" />
                  Regional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Moeda */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      <CurrencyDollar weight="bold" className="w-4 h-4 inline mr-2" />
                      Moeda
                    </label>
                    <div className="flex gap-2">
                      <OptionButton
                        selected={settings.currency === 'USD'}
                        onClick={() => updateSettings({ currency: 'USD' })}
                      >
                        $ USD
                      </OptionButton>
                      <OptionButton
                        selected={settings.currency === 'BRL'}
                        onClick={() => updateSettings({ currency: 'BRL' })}
                      >
                        R$ BRL
                      </OptionButton>
                      <OptionButton
                        selected={settings.currency === 'EUR'}
                        onClick={() => updateSettings({ currency: 'EUR' })}
                      >
                        € EUR
                      </OptionButton>
                    </div>
                  </div>

                  {/* Idioma */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                      Idioma
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <OptionButton
                        selected={settings.language === 'pt-BR'}
                        onClick={() => updateSettings({ language: 'pt-BR' })}
                      >
                        🇧🇷 Português
                      </OptionButton>
                      <OptionButton
                        selected={settings.language === 'en-US'}
                        onClick={() => updateSettings({ language: 'en-US' })}
                      >
                        🇺🇸 English
                      </OptionButton>
                      <OptionButton
                        selected={settings.language === 'es-ES'}
                        onClick={() => updateSettings({ language: 'es-ES' })}
                      >
                        🇪🇸 Español
                      </OptionButton>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notificações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell weight="duotone" className="w-5 h-5 text-accent-emerald" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Alertas de Preço</p>
                      <p className="text-xs text-text-muted">Receba quando preços atingirem alvos</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.notifications.priceAlerts}
                      onChange={(v) => updateNestedSettings('notifications', 'priceAlerts', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Alertas de Notícias</p>
                      <p className="text-xs text-text-muted">Notificações sobre notícias relevantes</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.notifications.newsAlerts}
                      onChange={(v) => updateNestedSettings('notifications', 'newsAlerts', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Atualizações do Portfólio</p>
                      <p className="text-xs text-text-muted">Resumos diários de performance</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.notifications.portfolioUpdates}
                      onChange={(v) => updateNestedSettings('notifications', 'portfolioUpdates', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Notificações por Email</p>
                      <p className="text-xs text-text-muted">Receba alertas no seu email</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.notifications.emailNotifications}
                      onChange={(v) => updateNestedSettings('notifications', 'emailNotifications', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacidade */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck weight="duotone" className="w-5 h-5 text-accent-gold" />
                  Privacidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Salvar Histórico</p>
                      <p className="text-xs text-text-muted">Manter histórico de buscas e ações</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.privacy.saveHistory}
                      onChange={(v) => updateNestedSettings('privacy', 'saveHistory', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Compartilhar Analytics</p>
                      <p className="text-xs text-text-muted">Ajude a melhorar o produto</p>
                    </div>
                    <ToggleSwitch
                      enabled={settings.privacy.shareAnalytics}
                      onChange={(v) => updateNestedSettings('privacy', 'shareAnalytics', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Dados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Gerenciar Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={handleExportData}>
                    <Export weight="bold" className="w-4 h-4" />
                    Exportar Dados
                  </Button>
                  <Button variant="secondary" onClick={handleResetSettings}>
                    <ArrowClockwise weight="bold" className="w-4 h-4" />
                    Restaurar Padrões
                  </Button>
                  <Button variant="outline" onClick={handleClearData} className="text-price-down border-price-down/30 hover:bg-price-down/10">
                    <Trash weight="bold" className="w-4 h-4" />
                    Limpar Todos os Dados
                  </Button>
                </div>
                <p className="text-xs text-text-muted mt-4">
                  Seus dados são armazenados localmente no seu navegador. Nenhuma informação é enviada para servidores externos.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
