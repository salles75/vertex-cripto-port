"""
Serviço de Análise Preditiva - FastAPI
Responsável por cálculos de médias móveis e análise técnica
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal
import numpy as np
from datetime import datetime

app = FastAPI(
    title="Vertex Analytics API",
    description="Serviço de análise preditiva para ativos financeiros",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ MODELOS ============

class PriceAnalysisRequest(BaseModel):
    """Request para análise de preços"""
    symbol: str = Field(..., description="Símbolo do ativo (ex: BTC)")
    prices: List[float] = Field(..., min_length=7, description="Lista de preços históricos")


class PredictionResponse(BaseModel):
    """Response com análise preditiva"""
    symbol: str
    currentPrice: float
    sma7: float
    sma14: float
    sma30: float
    ema7: float
    ema14: float
    rsi: float | None = None
    trend: Literal["bullish", "bearish", "neutral"]
    support: float
    resistance: float
    prediction: dict


class MovingAveragesResponse(BaseModel):
    """Response com médias móveis"""
    symbol: str
    sma: dict
    ema: dict
    currentPrice: float


class RSIResponse(BaseModel):
    """Response com RSI"""
    symbol: str
    rsi: float
    interpretation: str


# ============ FUNÇÕES DE ANÁLISE ============

def calculate_sma(prices: List[float], period: int) -> float:
    """
    Calcula Simple Moving Average (SMA)
    """
    if len(prices) < period:
        return np.mean(prices)
    return np.mean(prices[-period:])


def calculate_ema(prices: List[float], period: int) -> float:
    """
    Calcula Exponential Moving Average (EMA)
    Usa o multiplicador padrão: 2 / (period + 1)
    """
    if len(prices) == 0:
        return 0.0
    if len(prices) == 1:
        return prices[0]
    
    multiplier = 2 / (period + 1)
    ema = prices[0]
    
    for price in prices[1:]:
        ema = (price - ema) * multiplier + ema
    
    return ema


def calculate_rsi(prices: List[float], period: int = 14) -> float | None:
    """
    Calcula Relative Strength Index (RSI)
    RSI = 100 - (100 / (1 + RS))
    RS = Average Gain / Average Loss
    """
    if len(prices) < period + 1:
        return None
    
    # Calcula variações diárias
    deltas = np.diff(prices)
    
    # Separa ganhos e perdas
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    # Média móvel de ganhos e perdas
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return round(rsi, 2)


def calculate_support_resistance(prices: List[float]) -> tuple[float, float]:
    """
    Calcula níveis de suporte e resistência simples
    Baseado em mínimos e máximos recentes com margem
    """
    recent = prices[-30:] if len(prices) >= 30 else prices
    
    support = min(recent) * 0.98  # 2% abaixo do mínimo
    resistance = max(recent) * 1.02  # 2% acima do máximo
    
    return round(support, 2), round(resistance, 2)


def determine_trend(
    current_price: float,
    sma7: float,
    sma14: float,
    sma30: float
) -> Literal["bullish", "bearish", "neutral"]:
    """
    Determina tendência baseado em médias móveis
    Bullish: preço > SMA7 > SMA14 > SMA30
    Bearish: preço < SMA7 < SMA14 < SMA30
    """
    bullish_signals = 0
    bearish_signals = 0
    
    if current_price > sma7:
        bullish_signals += 1
    else:
        bearish_signals += 1
        
    if sma7 > sma14:
        bullish_signals += 1
    else:
        bearish_signals += 1
        
    if sma14 > sma30:
        bullish_signals += 1
    else:
        bearish_signals += 1
    
    if bullish_signals >= 2:
        return "bullish"
    elif bearish_signals >= 2:
        return "bearish"
    return "neutral"


def generate_prediction(
    trend: str,
    rsi: float | None,
    current_price: float,
    sma7: float
) -> dict:
    """
    Gera predição de curto prazo baseada em indicadores
    """
    confidence = 0.5
    direction = "stable"
    
    # Ajusta baseado na tendência
    if trend == "bullish":
        direction = "up"
        confidence += 0.15
    elif trend == "bearish":
        direction = "down"
        confidence += 0.15
    
    # Ajusta baseado no RSI
    if rsi is not None:
        if rsi > 70:  # Sobrecomprado
            if direction == "up":
                confidence -= 0.1
            else:
                direction = "down"
                confidence += 0.1
        elif rsi < 30:  # Sobrevendido
            if direction == "down":
                confidence -= 0.1
            else:
                direction = "up"
                confidence += 0.1
    
    # Ajusta baseado na distância do preço da SMA7
    price_deviation = (current_price - sma7) / sma7 * 100
    if abs(price_deviation) > 5:
        confidence += 0.05
    
    # Limita confidence entre 0.4 e 0.85
    confidence = max(0.4, min(0.85, confidence))
    
    return {
        "shortTerm": direction,
        "confidence": round(confidence, 2)
    }


# ============ ENDPOINTS ============

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "python-analytics",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/analysis/predict", response_model=PredictionResponse)
async def predict(request: PriceAnalysisRequest):
    """
    Gera análise preditiva completa para um ativo
    """
    try:
        prices = request.prices
        symbol = request.symbol.upper()
        
        current_price = prices[-1]
        
        # Calcula indicadores
        sma7 = calculate_sma(prices, 7)
        sma14 = calculate_sma(prices, 14)
        sma30 = calculate_sma(prices, 30)
        ema7 = calculate_ema(prices, 7)
        ema14 = calculate_ema(prices, 14)
        rsi = calculate_rsi(prices)
        
        # Determina tendência
        trend = determine_trend(current_price, sma7, sma14, sma30)
        
        # Calcula suporte/resistência
        support, resistance = calculate_support_resistance(prices)
        
        # Gera predição
        prediction = generate_prediction(trend, rsi, current_price, sma7)
        
        return PredictionResponse(
            symbol=symbol,
            currentPrice=round(current_price, 2),
            sma7=round(sma7, 2),
            sma14=round(sma14, 2),
            sma30=round(sma30, 2),
            ema7=round(ema7, 2),
            ema14=round(ema14, 2),
            rsi=rsi,
            trend=trend,
            support=support,
            resistance=resistance,
            prediction=prediction
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analysis/moving-averages", response_model=MovingAveragesResponse)
async def moving_averages(request: PriceAnalysisRequest):
    """
    Retorna apenas médias móveis
    """
    try:
        prices = request.prices
        symbol = request.symbol.upper()
        
        return MovingAveragesResponse(
            symbol=symbol,
            sma={
                "sma7": round(calculate_sma(prices, 7), 2),
                "sma14": round(calculate_sma(prices, 14), 2),
                "sma30": round(calculate_sma(prices, 30), 2),
                "sma50": round(calculate_sma(prices, 50), 2) if len(prices) >= 50 else None,
                "sma200": round(calculate_sma(prices, 200), 2) if len(prices) >= 200 else None,
            },
            ema={
                "ema7": round(calculate_ema(prices, 7), 2),
                "ema14": round(calculate_ema(prices, 14), 2),
                "ema21": round(calculate_ema(prices, 21), 2),
                "ema50": round(calculate_ema(prices, 50), 2) if len(prices) >= 50 else None,
            },
            currentPrice=round(prices[-1], 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analysis/rsi", response_model=RSIResponse)
async def rsi_endpoint(request: PriceAnalysisRequest):
    """
    Calcula RSI para um ativo
    """
    try:
        prices = request.prices
        symbol = request.symbol.upper()
        
        rsi = calculate_rsi(prices)
        
        if rsi is None:
            raise HTTPException(
                status_code=400,
                detail="Insufficient data for RSI calculation (minimum 15 points)"
            )
        
        # Interpretação
        if rsi > 70:
            interpretation = "Sobrecomprado - possível reversão para baixa"
        elif rsi > 60:
            interpretation = "Força compradora - tendência de alta"
        elif rsi < 30:
            interpretation = "Sobrevendido - possível reversão para alta"
        elif rsi < 40:
            interpretation = "Força vendedora - tendência de baixa"
        else:
            interpretation = "Neutro - mercado equilibrado"
        
        return RSIResponse(
            symbol=symbol,
            rsi=rsi,
            interpretation=interpretation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/indicators")
async def list_indicators():
    """
    Lista indicadores disponíveis
    """
    return {
        "indicators": [
            {
                "name": "SMA",
                "description": "Simple Moving Average",
                "periods": [7, 14, 30, 50, 200]
            },
            {
                "name": "EMA",
                "description": "Exponential Moving Average",
                "periods": [7, 14, 21, 50]
            },
            {
                "name": "RSI",
                "description": "Relative Strength Index",
                "period": 14
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
