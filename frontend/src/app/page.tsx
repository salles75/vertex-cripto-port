import { Suspense } from 'react'
import { DashboardClient } from './DashboardClient'
import { api } from '@/lib/api'

// Dados mock para fallback
const mockAssets = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto' as const,
    currentPrice: 67234.50,
    priceChange24h: 1245.30,
    priceChangePercent24h: 1.89,
    high24h: 68100.00,
    low24h: 65800.00,
    volume24h: 28500000000,
    marketCap: 1320000000000,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    lastUpdated: new Date(),
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto' as const,
    currentPrice: 3456.78,
    priceChange24h: -45.20,
    priceChangePercent24h: -1.29,
    high24h: 3520.00,
    low24h: 3410.00,
    volume24h: 15200000000,
    marketCap: 415000000000,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    lastUpdated: new Date(),
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    type: 'crypto' as const,
    currentPrice: 178.45,
    priceChange24h: 8.90,
    priceChangePercent24h: 5.25,
    high24h: 182.00,
    low24h: 168.50,
    volume24h: 4200000000,
    marketCap: 78000000000,
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    lastUpdated: new Date(),
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    type: 'crypto' as const,
    currentPrice: 612.30,
    priceChange24h: 12.40,
    priceChangePercent24h: 2.07,
    high24h: 620.00,
    low24h: 598.00,
    volume24h: 1800000000,
    marketCap: 94000000000,
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    lastUpdated: new Date(),
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    type: 'crypto' as const,
    currentPrice: 0.62,
    priceChange24h: -0.02,
    priceChangePercent24h: -3.12,
    high24h: 0.65,
    low24h: 0.60,
    volume24h: 2100000000,
    marketCap: 34000000000,
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    lastUpdated: new Date(),
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    type: 'crypto' as const,
    currentPrice: 0.58,
    priceChange24h: 0.03,
    priceChangePercent24h: 5.45,
    high24h: 0.60,
    low24h: 0.54,
    volume24h: 890000000,
    marketCap: 20500000000,
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    lastUpdated: new Date(),
  },
]

const mockNews = [
  {
    id: '1',
    title: 'Bitcoin mantém tendência de alta com suporte institucional crescente',
    description: 'Grandes investidores institucionais continuam acumulando Bitcoin, impulsionando o preço para novos patamares. Analistas apontam para uma possível valorização contínua nos próximos meses.',
    url: '#',
    source: 'CryptoNews',
    publishedAt: new Date(),
    relatedAssets: ['BTC'],
    sentiment: 'positive' as const,
  },
  {
    id: '2',
    title: 'Ethereum prepara atualização importante da rede',
    description: 'A próxima atualização promete melhorar a escalabilidade e reduzir taxas de transação na rede Ethereum, atraindo mais desenvolvedores e projetos DeFi.',
    url: '#',
    source: 'DeFi Pulse',
    publishedAt: new Date(Date.now() - 3600000),
    relatedAssets: ['ETH'],
    sentiment: 'positive' as const,
  },
  {
    id: '3',
    title: 'Solana registra aumento de 200% em volume de transações',
    description: 'A blockchain Solana continua atraindo desenvolvedores e projetos DeFi, aumentando sua relevância no ecossistema cripto.',
    url: '#',
    source: 'Blockchain Today',
    publishedAt: new Date(Date.now() - 7200000),
    relatedAssets: ['SOL'],
    sentiment: 'positive' as const,
  },
  {
    id: '4',
    title: 'Reguladores discutem novas diretrizes para o mercado',
    description: 'Autoridades financeiras globais se reúnem para debater framework regulatório para criptomoedas.',
    url: '#',
    source: 'Finance Weekly',
    publishedAt: new Date(Date.now() - 10800000),
    relatedAssets: [],
    sentiment: 'neutral' as const,
  },
  {
    id: '5',
    title: 'XRP enfrenta pressão de venda após decisão judicial',
    description: 'O token XRP registra queda após notícias sobre o processo judicial em andamento contra a Ripple Labs.',
    url: '#',
    source: 'Crypto Legal',
    publishedAt: new Date(Date.now() - 14400000),
    relatedAssets: ['XRP'],
    sentiment: 'negative' as const,
  },
]

async function getData() {
  try {
    // Tenta buscar dados reais da API
    const [assets, news] = await Promise.all([
      api.getAssets(20),
      api.getNews(10),
    ])
    
    return {
      assets: assets.length > 0 ? assets : mockAssets,
      news: news.length > 0 ? news : mockNews,
      isLive: assets.length > 0,
    }
  } catch (error) {
    console.log('API não disponível, usando dados de demonstração')
    // Retorna dados mock se a API não estiver disponível
    return {
      assets: mockAssets,
      news: mockNews,
      isLive: false,
    }
  }
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-white/10 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-white/10 rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-white/10 rounded-2xl" />
    </div>
  )
}

export default async function HomePage() {
  const { assets, news, isLive } = await getData()
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DashboardClient 
        initialAssets={assets} 
        initialNews={news}
        isLiveData={isLive}
      />
    </Suspense>
  )
}
