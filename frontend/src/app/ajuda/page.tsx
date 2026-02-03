'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Question,
  CaretDown,
  Envelope,
  GithubLogo,
  Book,
  ChartLineUp,
  Wallet,
  Bell,
  Star,
  Gear,
  Lightning,
  ShieldCheck,
  ArrowRight,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    category: 'Geral',
    question: 'O que é o Vertex Asset Manager?',
    answer: 'O Vertex é uma plataforma de gerenciamento de ativos financeiros focada em criptomoedas. Você pode acompanhar preços em tempo real, gerenciar seu portfólio, criar alertas de preço e visualizar análises técnicas dos seus ativos favoritos.',
  },
  {
    category: 'Geral',
    question: 'Os dados são armazenados onde?',
    answer: 'Todos os seus dados (portfólio, watchlist, alertas e configurações) são armazenados localmente no seu navegador usando localStorage. Nenhuma informação pessoal é enviada para servidores externos.',
  },
  {
    category: 'Geral',
    question: 'Qual a fonte dos dados de preços?',
    answer: 'Utilizamos a API do CoinGecko para obter dados de preços, volumes e market cap das criptomoedas. Os dados são atualizados em tempo real com cache inteligente para garantir performance.',
  },
  {
    category: 'Portfólio',
    question: 'Como adicionar ativos ao meu portfólio?',
    answer: 'Acesse a página Portfólio, clique em "Adicionar Ativo", busque a criptomoeda desejada, informe a quantidade e o preço médio de compra. O sistema calculará automaticamente seu lucro/prejuízo.',
  },
  {
    category: 'Portfólio',
    question: 'Como calcular o preço médio de compra?',
    answer: 'Se você fez várias compras do mesmo ativo, o sistema calcula automaticamente o preço médio ponderado. Basta adicionar cada compra separadamente que o Vertex fará o cálculo.',
  },
  {
    category: 'Watchlist',
    question: 'Posso adicionar quantos ativos quiser na watchlist?',
    answer: 'Sim! Você pode adicionar quantos ativos quiser para acompanhar. A watchlist é salva automaticamente e persiste mesmo após fechar o navegador.',
  },
  {
    category: 'Alertas',
    question: 'Como funcionam os alertas de preço?',
    answer: 'Você pode criar alertas para ser notificado quando um ativo atingir um preço específico (acima ou abaixo). Os alertas são verificados automaticamente quando você atualiza os dados.',
  },
  {
    category: 'Alertas',
    question: 'Recebo notificações em tempo real?',
    answer: 'Atualmente os alertas são verificados quando você atualiza os dados manualmente. Notificações push em tempo real estão em desenvolvimento para versões futuras.',
  },
  {
    category: 'Análises',
    question: 'O que significam os indicadores técnicos?',
    answer: 'SMA (Média Móvel Simples) e EMA (Média Móvel Exponencial) ajudam a identificar tendências. RSI (Índice de Força Relativa) indica se um ativo está sobrecomprado (>70) ou sobrevendido (<30). Suporte e resistência são níveis de preço importantes.',
  },
  {
    category: 'Análises',
    question: 'As previsões são confiáveis?',
    answer: 'As previsões são baseadas em análise técnica e devem ser usadas apenas como referência. O mercado de criptomoedas é volátil e imprevisível. Sempre faça sua própria pesquisa antes de investir.',
  },
]

const quickLinks = [
  { name: 'Dashboard', href: '/', icon: ChartLineUp, description: 'Visão geral do mercado' },
  { name: 'Portfólio', href: '/portfolio', icon: Wallet, description: 'Gerenciar investimentos' },
  { name: 'Watchlist', href: '/watchlist', icon: Star, description: 'Ativos favoritos' },
  { name: 'Alertas', href: '/notificacoes', icon: Bell, description: 'Configurar alertas' },
  { name: 'Análises', href: '/analises', icon: Lightning, description: 'Indicadores técnicos' },
  { name: 'Configurações', href: '/configuracoes', icon: Gear, description: 'Personalizar app' },
]

const categories = ['Todos', 'Geral', 'Portfólio', 'Watchlist', 'Alertas', 'Análises']

export default function AjudaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const filteredFaq = selectedCategory === 'Todos'
    ? faqData
    : faqData.filter(item => item.category === selectedCategory)

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
              <Question weight="fill" className="w-8 h-8 text-accent-emerald" />
              Central de Ajuda
            </motion.h1>
            <p className="text-text-muted mt-1">
              Encontre respostas para suas dúvidas
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((link, index) => (
              <Link key={link.name} href={link.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/5 border border-border-subtle hover:bg-white/10 hover:border-accent-emerald/30 transition-all group"
                >
                  <link.icon weight="duotone" className="w-6 h-6 text-accent-emerald mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-text-primary text-sm">{link.name}</p>
                  <p className="text-xs text-text-muted">{link.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book weight="duotone" className="w-5 h-5 text-accent-gold" />
                  Perguntas Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros de categoria */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        selectedCategory === category
                          ? 'bg-accent-emerald text-background-primary'
                          : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Lista de perguntas */}
                <div className="space-y-3">
                  {filteredFaq.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border border-border-subtle rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full p-4 flex items-center justify-between text-left bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="default" size="sm">{item.category}</Badge>
                          <span className="font-medium text-text-primary">{item.question}</span>
                        </div>
                        <CaretDown
                          weight="bold"
                          className={cn(
                            'w-5 h-5 text-text-muted transition-transform',
                            openIndex === index && 'rotate-180'
                          )}
                        />
                      </button>
                      <AnimatePresence>
                        {openIndex === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="p-4 pt-0 text-text-secondary text-sm leading-relaxed">
                              {item.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar de ajuda */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Contato */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Precisa de mais ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted mb-4">
                  Não encontrou o que procurava? Entre em contato conosco.
                </p>
                <div className="space-y-3">
                  <a
                    href="mailto:suporte@vertex.app"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Envelope weight="duotone" className="w-5 h-5 text-accent-emerald" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Email</p>
                      <p className="text-xs text-text-muted">suporte@vertex.app</p>
                    </div>
                  </a>
                  <a
                    href="https://github.com/vertex-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <GithubLogo weight="duotone" className="w-5 h-5 text-text-secondary" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">GitHub</p>
                      <p className="text-xs text-text-muted">Reporte bugs e sugestões</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Sobre */}
            <Card variant="glass" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-emerald to-accent-gold flex items-center justify-center">
                  <ChartLineUp weight="bold" className="w-6 h-6 text-background-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-text-primary">Vertex</p>
                  <p className="text-xs text-text-muted">Asset Manager v1.0.0</p>
                </div>
              </div>
              <p className="text-sm text-text-muted mb-4">
                Plataforma moderna de gerenciamento de ativos financeiros com foco em criptomoedas, análise técnica e acompanhamento em tempo real.
              </p>
              <div className="flex items-center gap-2">
                <ShieldCheck weight="fill" className="w-4 h-4 text-accent-emerald" />
                <span className="text-xs text-text-muted">Seus dados são armazenados localmente</span>
              </div>
            </Card>

            {/* Dicas */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightning weight="fill" className="w-5 h-5 text-accent-gold" />
                  Dicas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight weight="bold" className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">Clique em qualquer ativo para ver o gráfico detalhado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight weight="bold" className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">Use a watchlist para acompanhar seus ativos favoritos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight weight="bold" className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">Configure alertas para não perder oportunidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight weight="bold" className="w-4 h-4 text-accent-emerald mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">Exporte seus dados regularmente para backup</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
