# Vertex - Gerenciador de Ativos Financeiros

Um sistema completo para gerenciamento de ativos financeiros (criptomoedas) com agregador de notícias e análise preditiva em tempo real.

![Vertex Dashboard](https://via.placeholder.com/800x400/0a0f0d/10b981?text=Vertex+Dashboard)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Dashboard  │  │   Mercado    │  │   Notícias   │           │
│  │   Portfolio  │  │   Watchlist  │  │   Análises   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   Socket.io       │                        │
│                    │   (Real-time)     │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    Backend Node.js (Orquestrador)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Price API   │  │  News API    │  │  WebSocket   │           │
│  │  (CoinGecko) │  │  (Scraping)  │  │   Server     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                              │                                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                    Backend Python (Analytics)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    SMA/EMA   │  │     RSI      │  │  Predições   │           │
│  │   Cálculos   │  │   Análise    │  │  Tendência   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral do mercado em tempo real
- Estatísticas de Market Cap, Volume e tendências
- Gráficos interativos com Recharts
- Destaques do dia (maior alta/baixa)

### 💼 Portfólio
- Cadastro de ativos com quantidade e preço médio
- Cálculo automático de lucro/prejuízo
- Distribuição visual por ativo (Pie Chart)
- Resumo consolidado com métricas

### 📰 Agregador de Notícias
- Notícias do mercado em tempo real
- Análise de sentimento (positivo/negativo/neutro)
- Filtros por sentimento e ativo
- Indicador visual de sentimento do mercado

### 📈 Análise Técnica
- Médias Móveis (SMA 7, 14, 30 e EMA)
- RSI (Relative Strength Index)
- Suporte e Resistência
- Previsão de tendência com confiança

### 🔄 Tempo Real
- WebSocket para atualizações de preço
- Notificações de mudanças significativas
- Sincronização automática de dados

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** - App Router com Server/Client Components
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Recharts** - Gráficos interativos
- **Framer Motion** - Animações fluidas
- **Phosphor Icons** - Biblioteca de ícones moderna
- **Zustand** - Gerenciamento de estado
- **Socket.io Client** - Comunicação em tempo real

### Backend Node.js
- **Express** - Framework HTTP
- **Socket.io** - WebSocket server
- **Cheerio** - Web scraping
- **Axios** - Cliente HTTP
- **Winston** - Logging
- **TypeScript** - Tipagem estática

### Backend Python
- **FastAPI** - Framework web assíncrono
- **Pandas** - Manipulação de dados
- **NumPy** - Cálculos numéricos
- **Uvicorn** - ASGI server

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- Docker (opcional)

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone <repo-url>
cd "Ativos Financeiros"
```

2. **Configurar variáveis de ambiente**
```bash
# Copie os arquivos .env.example para .env em cada pasta
# e configure conforme necessário
```

3. **Backend Python**
```bash
cd backend-python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

4. **Backend Node.js**
```bash
cd backend-node
npm install
npm run dev
```

5. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

6. Acesse `http://localhost:3000`

### Docker Compose

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 📁 Estrutura de Pastas

```
.
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router (páginas)
│   │   ├── components/       # Componentes React
│   │   │   ├── analysis/     # Análise técnica
│   │   │   ├── assets/       # Cards de ativos
│   │   │   ├── charts/       # Gráficos
│   │   │   ├── layout/       # Header, Sidebar
│   │   │   ├── news/         # Feed de notícias
│   │   │   ├── portfolio/    # Gestão de portfólio
│   │   │   └── ui/           # Componentes base
│   │   ├── lib/              # Utilitários e API
│   │   ├── store/            # Estado global (Zustand)
│   │   └── types/            # TypeScript types
│   └── ...
│
├── backend-node/
│   ├── src/
│   │   ├── routes/           # Rotas da API
│   │   ├── services/         # Lógica de negócio
│   │   ├── websocket/        # Handlers WebSocket
│   │   └── types/            # TypeScript types
│   └── ...
│
├── backend-python/
│   ├── main.py               # FastAPI app
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

## 🎨 Design System

### Cores
- **Background**: Dark (#0a0f0d, #111916, #1a2420)
- **Accent Emerald**: #10b981 (verde esmeralda)
- **Accent Gold**: #f59e0b (dourado)
- **Price Up**: #22c55e (verde)
- **Price Down**: #ef4444 (vermelho)

### Fontes
- **Display**: Outfit (títulos e texto)
- **Mono**: JetBrains Mono (números e dados)

### Componentes
- Glassmorphism sutil com blur
- Gradientes escuros sofisticados
- Animações com Framer Motion
- Ícones Phosphor (diferenciados)

## 📡 API Endpoints

### Backend Node.js (porta 3001)

```
GET  /health                    # Health check
GET  /api/assets                # Lista ativos
GET  /api/assets/:id            # Detalhes do ativo
GET  /api/assets/:id/history    # Histórico de preços
GET  /api/assets/search?q=      # Busca ativos
GET  /api/news                  # Lista notícias
GET  /api/news/asset/:symbol    # Notícias por ativo
GET  /api/news/sentiment        # Análise de sentimento
GET  /api/analysis/:id          # Análise técnica
```

### Backend Python (porta 8000)

```
GET  /health                          # Health check
POST /api/analysis/predict            # Previsão completa
POST /api/analysis/moving-averages    # Médias móveis
POST /api/analysis/rsi                # RSI
GET  /api/analysis/indicators         # Lista indicadores
```

## 🔌 WebSocket Events

### Client → Server
- `subscribe:assets` - Inscrever para preços
- `unsubscribe:assets` - Cancelar inscrição
- `subscribe:news` - Inscrever para notícias
- `request:asset` - Solicitar dados específicos
- `request:history` - Solicitar histórico

### Server → Client
- `prices:initial` - Dados iniciais de preços
- `prices:update` - Atualização de preços
- `news:initial` - Notícias iniciais
- `news:update` - Novas notícias
- `error` - Erros

## 📈 Roadmap

- [ ] Autenticação de usuários
- [ ] Persistência em banco de dados
- [ ] Alertas de preço personalizados
- [ ] Suporte a ações (stocks)
- [ ] Dashboard de métricas avançadas
- [ ] API pública
- [ ] Mobile app (React Native)

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com 💚 usando tecnologias modernas
