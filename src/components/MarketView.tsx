import React, { useState } from 'react';
import { GameState, RivalBrand, BrandCategory } from '../types';
import { 
  LineChart, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Swords, 
  Handshake, 
  PieChart, 
  Search,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface MarketViewProps {
  gameState: GameState;
  onUpdateGameState: (nextState: GameState) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  gameState,
  onUpdateGameState,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketNotice, setMarketNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const stockHistory = gameState.stockHistory;
  const marketCap = gameState.stockPrice * gameState.sharesTotal;

  // Render SVG Chart for $VNTX
  const renderChart = () => {
    if (stockHistory.length < 2) return null;

    const prices = stockHistory.map(p => p.price);
    const minPrice = Math.max(0, Math.min(...prices) * 0.85);
    const maxPrice = Math.max(...prices) * 1.15;
    const range = maxPrice - minPrice || 1;

    const width = 600;
    const height = 180;
    const padding = 25;

    const points = stockHistory.map((pt, i) => {
      const x = padding + (i / (stockHistory.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((pt.price - minPrice) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const isBullish = prices[prices.length - 1] >= prices[0];

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-52">
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isBullish ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isBullish ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="4" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="4" />

          {/* Area fill */}
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill="url(#stockGradient)"
          />

          {/* Price Line */}
          <polyline
            fill="none"
            stroke={isBullish ? '#34d399' : '#fb7185'}
            strokeWidth="2.5"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Final point marker */}
          {stockHistory.length > 0 && (
            <circle
              cx={width - padding}
              cy={height - padding - ((stockHistory[stockHistory.length - 1].price - minPrice) / range) * (height - 2 * padding)}
              r="4.5"
              fill={isBullish ? '#34d399' : '#fb7185'}
              stroke="#0f172a"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>
    );
  };

  const handleBuyback = () => {
    const cost = 50000;
    if (gameState.cash < cost) {
      sounds.playWarningBeep();
      setMarketNotice({
        message: 'Caixa insuficiente ($50.000 necessários para o programa de recompra de ações)!',
        type: 'error'
      });
      return;
    }

    sounds.playCashChime();
    sounds.playMarketBell();

    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    nextState.cash -= cost;
    nextState.playerSharesPercent = Math.min(100, nextState.playerSharesPercent + 2);
    nextState.stockPrice = Number((nextState.stockPrice * 1.08).toFixed(2));
    nextState.reputation.investors = Math.min(100, nextState.reputation.investors + 8);

    nextState.newsFeed.unshift({
      id: `news_buyback_${Date.now()}`,
      day: nextState.day,
      quarter: nextState.quarter,
      source: 'Wall Street Dispatch',
      title: 'Vantex Dynamics deflagra programa de recompra e eleva fatia do CEO',
      snippet: 'Mercado comemora confiança da diretoria em seu próprio valuation.',
      sentiment: 'bullish',
    });

    setMarketNotice({
      message: 'Recompra executada! Sua fatia aumentou +2% e ações $VNTX valorizaram +8%.',
      type: 'success'
    });
    onUpdateGameState(nextState);
  };

  const handleFollowOn = () => {
    if (gameState.playerSharesPercent <= 20) {
      sounds.playWarningBeep();
      setMarketNotice({
        message: 'Sua participação acionária está perigosamente baixa para nova diluição de capital!',
        type: 'error'
      });
      return;
    }

    sounds.playCashChime();
    sounds.playMarketBell();

    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    const cashRaised = Math.round(nextState.stockPrice * 50000);
    nextState.cash += cashRaised;
    nextState.playerSharesPercent -= 5;
    nextState.stockPrice = Number((nextState.stockPrice * 0.96).toFixed(2));

    nextState.newsFeed.unshift({
      id: `news_followon_${Date.now()}`,
      day: nextState.day,
      quarter: nextState.quarter,
      source: 'Wall Street Dispatch',
      title: 'Vantex Dynamics capta capital fresco em oferta pública secundária (Follow-On)',
      snippet: `Injeção de $${cashRaised.toLocaleString()} no caixa operacional acelera expansão ao custo de leve diluição.`,
      sentiment: 'neutral',
    });

    setMarketNotice({
      message: `Follow-On bem-sucedido! +$${cashRaised.toLocaleString()} captados com diluição de 5%.`,
      type: 'success'
    });
    onUpdateGameState(nextState);
  };

  const handlePartnerWithRival = (brandId: string) => {
    const brand = gameState.rivals[brandId];
    if (!brand) return;

    sounds.playClick();
    sounds.playCashChime();

    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    nextState.rivals[brandId].relationshipScore = Math.min(100, (nextState.rivals[brandId].relationshipScore || 0) + 25);
    nextState.quarterlyRevenue += 35000;
    nextState.reputation.public = Math.min(100, nextState.reputation.public + 5);

    nextState.newsFeed.unshift({
      id: `news_partner_${Date.now()}`,
      day: nextState.day,
      quarter: nextState.quarter,
      source: 'TechPulse News',
      title: `ALIANÇA: Vantex Dynamics fecha memorando de entendimento com ${brand.name}`,
      snippet: `${brand.leaderName} afirma: "Unir forças é mais lucrativo do que brigar na justiça".`,
      sentiment: 'bullish',
    });

    setMarketNotice({
      message: `Acordo de cooperação com a ${brand.name} formalizado! +$35.000 em receita trimestral.`,
      type: 'success'
    });
    onUpdateGameState(nextState);
  };

  const handleHostileTakeover = (brandId: string) => {
    const brand = gameState.rivals[brandId];
    if (!brand) return;

    if (brand.isAcquired) {
      setMarketNotice({
        message: `A ${brand.name} já foi adquirida e incorporada ao seu império!`,
        type: 'error'
      });
      return;
    }

    if (gameState.cash < brand.hostileTakeoverCost) {
      sounds.playWarningBeep();
      setMarketNotice({
        message: `Capital insuficiente para OPA Hostil! Necessário: $${brand.hostileTakeoverCost.toLocaleString()}`,
        type: 'error'
      });
      return;
    }

    sounds.playGavelStrike();
    sounds.playSuccessChime();

    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    nextState.cash -= brand.hostileTakeoverCost;
    nextState.rivals[brandId].isAcquired = true;
    nextState.stockPrice = Number((nextState.stockPrice * 1.8).toFixed(2));
    nextState.quarterlyRevenue += Math.round(brand.marketCap * 0.005);
    nextState.traits.ruthless = Math.min(100, nextState.traits.ruthless + 25);

    nextState.newsFeed.unshift({
      id: `news_takeover_${Date.now()}`,
      day: nextState.day,
      quarter: nextState.quarter,
      source: 'Wall Street Dispatch',
      title: `TERREMOTO GLOBAL: Vantex Dynamics adquire controle total da ${brand.name}!`,
      snippet: `Em manobra histórica de M&A, o CEO da Vantex comprou o controle da rival.`,
      sentiment: 'bullish',
    });

    setMarketNotice({
      message: `OPA Hostil consumada com êxito! A ${brand.name} agora é uma subsidiária da Vantex Dynamics.`,
      type: 'success'
    });
    onUpdateGameState(nextState);
  };

  const rivalsList = (Object.values(gameState.rivals) as RivalBrand[]).filter(brand => {
    if (categoryFilter !== 'all' && brand.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return brand.name.toLowerCase().includes(q) || brand.parodyOf.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Market Action Feedback Notice */}
      {marketNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-all animate-fadeIn ${
            marketNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {marketNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{marketNotice.message}</span>
          </div>
          <button
            onClick={() => setMarketNotice(null)}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vantex Stock Chart Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xl text-cyan-300">$VNTX</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Nasdaq / B3 Simulado
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-100 mt-1">
              ${gameState.stockPrice.toFixed(2)}
              <span className="text-xs text-slate-400 font-sans ml-2">por ação</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBuyback}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Recompra de Ações ($50k)
            </button>
            <button
              onClick={handleFollowOn}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition"
            >
              Follow-On (Captação)
            </button>
          </div>
        </div>

        {/* The Graphic Chart */}
        {renderChart()}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-850 text-xs">
          <div>
            <span className="text-slate-400">Market Cap:</span>
            <div className="font-mono font-bold text-slate-200">${Math.round(marketCap).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-400">Ações Emitidas:</span>
            <div className="font-mono font-bold text-slate-200">{gameState.sharesTotal.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-400">Sua Posição (Equity):</span>
            <div className="font-mono font-bold text-amber-300">{gameState.playerSharesPercent}%</div>
          </div>
          <div>
            <span className="text-slate-400">Confiança do Mercado:</span>
            <div className="font-mono font-bold text-emerald-400">{gameState.reputation.investors}/100</div>
          </div>
        </div>
      </div>

      {/* Rivals Section Header & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-slate-100 text-base flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <span>Universo Corporativo & Marcas Rivais</span>
            </h3>
            <p className="text-xs text-slate-400">
              Forme parcerias bilaterais, compre participações ou execute uma OPA Hostil para dominar o mercado.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar marca rival..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Todas as Marcas' },
            { id: 'tech', label: 'Big Tech' },
            { id: 'finance', label: 'Bancos & Fundos' },
            { id: 'retail', label: 'Varejo & Consumo' },
            { id: 'auto', label: 'Mobilidade & Carros' },
            { id: 'media', label: 'Mídia & Entretenimento' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                categoryFilter === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rivals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rivalsList.map((brand) => {
          const isAcquired = Boolean(brand.isAcquired);

          return (
            <div
              key={brand.id}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                isAcquired 
                  ? 'border-emerald-500/50 bg-emerald-950/20' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 text-base">{brand.name}</h4>
                      {isAcquired && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          ADQUIRIDA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 italic">
                      Paródia de: {brand.parodyOf}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-850">
                    ${brand.sharePrice.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 my-2 italic line-clamp-2">
                  "{brand.tagline}"
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs space-y-1 my-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Market Cap:</span>
                    <span className="font-mono font-bold text-slate-200">
                      ${(brand.marketCap / 1_000_000_000).toFixed(1)}B
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Liderança:</span>
                    <span className="font-medium text-slate-300 truncate max-w-[140px]">{brand.leaderName}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Relação Diplomática:</span>
                    <span className={`font-bold font-mono ${brand.relationshipScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {brand.relationshipScore > 0 ? '+' : ''}{brand.relationshipScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-850">
                <button
                  onClick={() => handlePartnerWithRival(brand.id)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Handshake className="w-3.5 h-3.5 text-amber-400" />
                  <span>Propor Parceria Comercial</span>
                </button>

                {!isAcquired && (
                  <button
                    onClick={() => handleHostileTakeover(brand.id)}
                    className="w-full py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-900/60 transition flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>Takeover Hostil (${(brand.hostileTakeoverCost / 1_000_000_000).toFixed(1)}B)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
