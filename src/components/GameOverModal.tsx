import React from 'react';
import { GameState, GameEnding } from '../types';
import { Trophy, AlertTriangle, Sparkles, Flame, RotateCcw, Building2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  gameState: GameState;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  gameState,
  onRestart,
}) => {
  if (!isOpen) return null;

  const ending = gameState.ending || 'liquidation_collapse';
  const marketCap = gameState.stockPrice * gameState.sharesTotal;
  const netWorth = Math.round(marketCap * (gameState.playerSharesPercent / 100));

  const getEndingDetails = () => {
    switch (ending) {
      case 'ethical_visionary':
        return {
          title: 'FINAL 1: O VISIONÁRIO ÉTICO',
          icon: Trophy,
          iconColor: 'text-amber-400',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          tagline: 'Construindo o Futuro com Integridade e Alta Tecnologia',
          story: `Você provou a Wall Street que rentabilidade e decência não são antagônicos. A Vantex Dynamics realizou o maior IPO do setor tecnológico com nota máxima em governança (ESG) e admiração unânime de seus colaboradores. O escândalo de Arthur Vance tornou-se apenas uma nota de rodapé no seu império ético.`,
        };
      case 'wall_street_shark':
        return {
          title: 'FINAL 2: O TUBARÃO DE WALL STREET',
          icon: Sparkles,
          iconColor: 'text-cyan-400',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          tagline: 'O Monopólio Perfeito e a Vitória dos Predadores',
          story: `Sem espaço para sentimentalismo, você manobrou os conselhos, esmagou os rivais em OPAs hostis e transformou a Vantex Dynamics em um conglomerado trilionário imune a qualquer regulação. Sua cadeira na Forbes está assegurada e seu nome sussurrado com reverência e temor nos pregões globais.`,
        };
      case 'phoenix_turnaround':
        return {
          title: 'FINAL 3: A MANOBRA FÊNIX',
          icon: Flame,
          iconColor: 'text-amber-500',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          tagline: 'Do Colapso Iminente ao Triunfo Absoluto',
          story: `Nos últimos dias antes da execução judicial da falência, você conseguiu uma virada lendária. Renegociou prazos impossíveis, salvou a Vantex Dynamics no fio da navalha e reconstruiu uma máquina de gerar caixa. Harvard escreverá estudos de caso sobre o seu mandato.`,
        };
      case 'liquidation_collapse':
      default:
        return {
          title: 'COLAPSO: LIQUIDAÇÃO JUDICIAL',
          icon: AlertTriangle,
          iconColor: 'text-rose-500',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          tagline: 'O Relógio Zerou e o Confiança Federal Penhorou a Empresa',
          story: `O prazo fatal de 90 dias venceu sem que o passivo herdado de Arthur Vance fosse amortizado. O Tribunal de Falências lacrou as portas da Vantex Dynamics, os servidores foram leiloados a preço de sucata e a marca deixou de existir. A história corporativa é implacável com os inadimplentes.`,
        };
    }
  };

  const details = getEndingDetails();
  const Icon = details.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#14161C] border border-white/10 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-[#1A1D24] border border-white/10 flex items-center justify-center mx-auto shadow-inner">
          <Icon className={`w-8 h-8 ${details.iconColor}`} />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${details.badgeColor}`}>
            {details.title}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">
            {details.tagline}
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed text-left sm:text-center font-sans">
            {details.story}
          </p>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0A0B0E] p-4 rounded-xl border border-white/10 text-left">
          <div>
            <div className="text-[10px] text-white/40 font-mono font-bold uppercase">Tempo no Cargo</div>
            <div className="text-sm font-mono font-bold text-white">{gameState.day} dias (Q{gameState.quarter})</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 font-mono font-bold uppercase">Valuation Final</div>
            <div className="text-sm font-mono font-bold text-orange-400">${Math.round(marketCap).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 font-mono font-bold uppercase">Patrimônio Pessoal</div>
            <div className="text-sm font-mono font-bold text-green-400">${netWorth.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 font-mono font-bold uppercase">Veredito da CVM</div>
            <div className="text-sm font-mono font-bold text-blue-400">
              {gameState.traits.ethical >= 50 ? 'Aprovado' : 'Sob Investigação'}
            </div>
          </div>
        </div>

        {/* Restart Action */}
        <button
          onClick={() => {
            sounds.playClick();
            onRestart();
          }}
          className="w-full py-3.5 rounded bg-white text-black hover:bg-orange-500 hover:text-white font-bold text-xs uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Iniciar Novo Mandato Executivo (Recomeçar)</span>
        </button>
      </div>
    </div>
  );
};
