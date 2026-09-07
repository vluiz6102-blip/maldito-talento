import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { 
  Building2, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Volume2, 
  VolumeX, 
  Play, 
  FastForward,
  CheckCircle2,
  Music,
  ShieldCheck
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  gameState: GameState;
  onAdvanceDays: (days: number) => void;
  isSimulating: boolean;
  onOpenDebtModal: () => void;
  onOpenReputationModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  onAdvanceDays,
  isSimulating,
  onOpenDebtModal,
  onOpenReputationModal,
}) => {
  const [muted, setMuted] = useState(sounds.getIsMuted());
  const [musicPlaying, setMusicPlaying] = useState(sounds.isBackgroundMusicPlaying());

  useEffect(() => {
    const unsubscribe = sounds.subscribeMusicState((playing) => {
      setMusicPlaying(playing);
    });
    return unsubscribe;
  }, []);

  const toggleSound = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) sounds.playClick();
  };

  const toggleMusic = async () => {
    sounds.playClick();
    const isNowPlaying = await sounds.toggleBackgroundMusic();
    setMusicPlaying(isNowPlaying);
  };

  const marketCap = gameState.stockPrice * gameState.sharesTotal;
  const isDebtUrgent = gameState.debt > 0 && gameState.debtDeadlineDays <= 30;

  return (
    <header className="sticky top-0 z-40 bg-[#14161C] border-b border-white/10 text-[#E0E0E0] shadow-2xl">
      {/* Top Banner for Debt Emergency */}
      {gameState.debt > 0 && (
        <div className={`px-4 sm:px-6 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
          isDebtUrgent 
            ? 'bg-red-500/20 text-red-300 border-b border-red-500/40 animate-pulse' 
            : 'bg-orange-500/15 text-orange-300 border-b border-orange-500/30'
        }`}>
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span className="truncate">
              <strong className="tracking-wide">DÍVIDA BANCÁRIA:</strong> Restam <strong>{gameState.debtDeadlineDays} dias</strong> para quitar ${gameState.debt.toLocaleString()} com o Confiança Federal ou a liquidação é executada!
            </span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenDebtModal();
            }}
            className="px-3 py-1 rounded bg-white text-black hover:bg-orange-500 hover:text-white font-bold text-[10px] uppercase tracking-wider transition shrink-0 ml-2"
          >
            Amortizar / Negociar
          </button>
        </div>
      )}

      {/* Main Executive Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Era Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center font-bold text-xl text-white shadow-md shadow-orange-950/50 shrink-0">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase text-white">
                CEO Empire
              </h1>
              <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-orange-400 border border-white/10">
                {gameState.era === 'garage' && 'Garagem'}
                {gameState.era === 'scaleup' && 'Scale-Up'}
                {gameState.era === 'national' && 'Corporação'}
                {gameState.era === 'global' && 'Global'}
                {gameState.era === 'empire' && 'Império'}
              </span>
            </div>
            <p className="text-[10px] text-orange-500 font-mono tracking-widest uppercase">
              ERA: {gameState.era.toUpperCase()} (DIA {gameState.day}/90 • Q{gameState.quarter})
            </p>
          </div>
        </div>

        {/* Financial Tickers (matching Elegant Dark metrics pattern) */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
          {/* Capital */}
          <div className="text-left sm:text-center">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest leading-none mb-1">
              Capital
            </p>
            <p className={`text-sm font-mono font-bold ${gameState.cash < 20000 ? 'text-red-400' : 'text-green-400'}`}>
              ${Math.round(gameState.cash).toLocaleString()}
            </p>
          </div>

          {/* Dívida */}
          <div className="text-left sm:text-center">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest leading-none mb-1">
              Dívida
            </p>
            <p className="text-sm font-mono font-bold text-red-400">
              {gameState.debt > 0 ? `$${gameState.debt.toLocaleString()}` : <span className="text-green-400">Quitada</span>}
            </p>
          </div>

          {/* Market Cap */}
          <div className="text-left sm:text-center hidden sm:block">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest leading-none mb-1">
              Market Cap
            </p>
            <p className="text-sm font-mono font-bold text-blue-400">
              ${(marketCap >= 1000000) ? (marketCap / 1000000).toFixed(2) + 'M' : Math.round(marketCap).toLocaleString()}
            </p>
          </div>

          {/* Ação $VNTX */}
          <div className="text-left sm:text-center hidden md:block">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest leading-none mb-1">
              $VNTX Ação
            </p>
            <p className="text-sm font-mono font-bold text-orange-400">
              ${gameState.stockPrice.toFixed(2)}
            </p>
          </div>

          {/* Clickable Reputation Indicator Bar */}
          <button
            onClick={() => {
              if (onOpenReputationModal) {
                sounds.playClick();
                onOpenReputationModal();
              }
            }}
            title="Clique para ver o painel detalhado de reputação e impacto no faturamento"
            className="text-center border-l border-white/10 pl-4 sm:pl-6 hidden lg:block hover:bg-white/5 p-1 rounded transition-all"
          >
            <div className="flex items-center gap-1 justify-center text-[10px] text-white/60 hover:text-orange-400 uppercase tracking-widest leading-none mb-1.5 font-semibold">
              <ShieldCheck className="w-3 h-3 text-orange-500" />
              <span>Reputação</span>
            </div>
            <div className="flex gap-1 items-center justify-center">
              <div className={`h-1.5 w-4 rounded-xs ${gameState.reputation.public >= 25 ? 'bg-cyan-500' : 'bg-white/10'}`} title={`Consumidor: ${gameState.reputation.public}%`} />
              <div className={`h-1.5 w-4 rounded-xs ${gameState.reputation.investors >= 25 ? 'bg-emerald-500' : 'bg-white/10'}`} title={`Investidores: ${gameState.reputation.investors}%`} />
              <div className={`h-1.5 w-4 rounded-xs ${gameState.reputation.employees >= 25 ? 'bg-indigo-500' : 'bg-white/10'}`} title={`Equipe: ${gameState.reputation.employees}%`} />
              <div className={`h-1.5 w-4 rounded-xs ${gameState.reputation.esg >= 25 ? 'bg-amber-500' : 'bg-white/10'}`} title={`ESG: ${gameState.reputation.esg}%`} />
            </div>
          </button>
        </div>

        {/* Time Steppers & Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onAdvanceDays(7);
            }}
            disabled={isSimulating || gameState.isGameOver}
            title="Avançar 7 dias de operações"
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-white/5 hover:bg-white/10 active:scale-95 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 text-orange-500" />
            <span>+7 Dias</span>
          </button>

          <button
            onClick={() => {
              sounds.playMarketBell();
              onAdvanceDays(90);
            }}
            disabled={isSimulating || gameState.isGameOver}
            title="Fechar trimestre atual e apurar balanço"
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-950/40 transition disabled:opacity-40"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fechar Trimestre</span>
            <span className="sm:hidden">+Qtr</span>
          </button>

          {/* Background Ambient Lounge Music Toggle */}
          <button
            onClick={toggleMusic}
            title={musicPlaying ? 'Pausar música ambiente (Lo-Fi Lounge)' : 'Tocar música ambiente leve (Lo-Fi Lounge)'}
            className={`p-2 rounded border transition flex items-center gap-1 text-xs ${
              musicPlaying
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-sm'
                : 'text-white/40 hover:text-white hover:bg-white/5 border-white/5'
            }`}
          >
            <Music className={`w-4 h-4 ${musicPlaying ? 'animate-bounce text-orange-400' : ''}`} />
            <span className="hidden xl:inline text-[10px] font-mono">
              {musicPlaying ? 'Música: ON' : 'Música'}
            </span>
          </button>

          {/* SFX Mute Button */}
          <button
            onClick={toggleSound}
            title={muted ? 'Ativar efeitos sonoros' : 'Silenciar efeitos sonoros'}
            className="p-2 rounded text-white/40 hover:text-white hover:bg-white/5 border border-white/5 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white/70" />}
          </button>
        </div>
      </div>
    </header>
  );
};
