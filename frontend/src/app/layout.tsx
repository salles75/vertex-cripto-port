import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
})

export const metadata: Metadata = {
  title: 'Vertex | Gerenciador de Ativos Financeiros',
  description: 'Gerencie seus investimentos em ações e criptomoedas com análise preditiva e notícias em tempo real.',
  keywords: ['finanças', 'investimentos', 'ações', 'criptomoedas', 'bitcoin', 'análise'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-display antialiased">
        <div className="mesh-bg grid-pattern min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
