import React from 'react';
import { GameState } from '../types';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Leaf, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2,
  MessagesSquare,
  Scale,
  Rocket
} from 'lucide-react';
import { TabType } from './Navigation';
import { sounds } from '../utils/audio';

interface DashboardViewProps {
  gameState: GameState;
  onNavigateTab: (tab: TabType) => void;
  onOpenDebtModal: () => void;
  onOpenReputationModal?: () => void;
  onAdvanceDays: (days: number) => void;
  isSimulating: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  gameState,
  onNavigateTab,
  onOpenDebtModal,
  onOpenReputationModal,
  onAdvanceDays,
  isSimulating,
}) => {
  const marketCap = gameState.stockPrice * gameState.sharesTotal;
  const netQuarter = gameState.quarterlyRevenue - gameState.quarterlyExpenses;

  // Era descriptive targets
  const getEraObjective = () => {
    switch (gameState.era) {
      case 'garage':
        return {
          title: 'Sobrevivência da Garagem (Meta de 90 Dias)',
          desc: 'Pague ou renegocie a dívida de $500k com o Confiança Federal e acumule $250k em caixa para alcançar a era Scale-Up.',
          progress: gameState.debt <= 0 ? 100 : Math.min(95, Math.round(((500000 - gameState.debt) / 500000) * 100)),
        };
      case 'scaleup':
        return {
          title: 'Expansão & Tração de Produto',
          desc: 'Aumente o faturamento trimestral para $400k e acumule $500k em caixa para se tornar uma Corporação Nacional.',
          progress: Math.min(100, Math.round((gameState.quarterlyRevenue / 400000) * 100)),
        };
      case 'national':
        return {
          title: 'Domínio do Mercado Nacional',
          desc: 'Alcance $1.5M em faturamento trimestral e eleve as ações $VNTX acima de $25.00 para entrar na liga Global.',
          progress: Math.min(100, Math.round((gameState.stockPrice / 25) * 100)),
        };
      case 'global':
        return {
          title: 'Concorrência com Titãs Globais',
          desc: 'Eleve a cotação acima de $80.00 ou alcance $10M em caixa livre para declarar a era de Império.',
          progress: Math.min(100, Math.round((gameState.stockPrice / 80) * 100)),
        };
      case 'empire':
        return {
          title: 'A Batalha Final pelo Monopólio ou IPO Histórico',
          desc: 'Consolide um IPO trilionário com alto ESG (Final Visionário) ou execute a aquisição hostil dos rivais (Final Tubarão).',
          progress: 95,
        };
    }
  };

  const objective = getEraObjective();

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome & Alert Section (Design HTML styled) */}
      {gameState.debt > 0 && (
        <div className="rounded-xl bg-[#1A1D24] border border-white/5 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded font-mono uppercase tracking-wider border border-red-500/30">
              CRÍTICO • {gameState.debtDeadlineDays} DIAS RESTANTES
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-orange-500 font-mono tracking-widest uppercase">
                  Tribunal de Falências • Processo nº 004829-CF/SP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-light italic text-white">
                Vantex Dynamics enfrenta execução de dívida bancária
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                O Confiança Federal exige a quitação ou reestruturação de <strong className="text-red-400 font-mono font-bold">${gameState.debt.toLocaleString()}</strong>. Se o prazo fatal expirar, o banco executará a penhora dos servidores e da propriedade intelectual. Amortize em caixa ou negocie prazos via IA com o Dr. Osvaldo Barreto.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenDebtModal();
                }}
                className="px-5 py-3 bg-white text-black text-xs font-bold rounded hover:bg-orange-500 hover:text-white uppercase tracking-wider transition-colors shadow-lg"
              >
                Amortizar Dívida
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onNavigateTab('negotiation');
                }}
                className="px-5 py-3 bg-white/5 border border-white/10 text-xs font-bold rounded hover:bg-white/10 text-white uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <MessagesSquare className="w-4 h-4 text-orange-500" />
                <span>Negociar no Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid (Elegant Dark metrics layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Card */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-mono uppercase tracking-widest">
            <span>Capital Disponível</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-green-400 truncate">
              ${Math.round(gameState.cash).toLocaleString()}
            </div>
            <div className="text-[11px] text-white/40 flex items-center gap-1 mt-1">
              <span>Fluxo diário:</span>
              <span className={`font-mono font-bold ${netQuarter >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netQuarter >= 0 ? '+' : ''}${Math.round(netQuarter / 90).toLocaleString()}/dia
              </span>
            </div>
          </div>
          <div className="text-[10px] text-white/30 border-t border-white/5 pt-2">
            Despesas trimestrais: ${gameState.quarterlyExpenses.toLocaleString()}
          </div>
        </div>

        {/* Debt Card */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-mono uppercase tracking-widest">
            <span>Passivo Bancário</span>
            <Building2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-red-400 truncate">
              {gameState.debt > 0 ? `$${gameState.debt.toLocaleString()}` : <span className="text-green-400 flex items-center gap-1">QUITADA <CheckCircle2 className="w-5 h-5 inline" /></span>}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              {gameState.debt > 0 ? `Vence em ${gameState.debtDeadlineDays} dias corridos` : 'Sem pendências bancárias'}
            </div>
          </div>
          <div className="text-[10px] text-white/30 border-t border-white/5 pt-2">
            Taxa: 3.5% ao trimestre no principal
          </div>
        </div>

        {/* Stock Price Card */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-mono uppercase tracking-widest">
            <span>Ação $VNTX</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-orange-400">
              ${gameState.stockPrice.toFixed(2)}
            </div>
            <div className="text-[11px] text-white/40 flex items-center gap-1 mt-1">
              <span>Sua participação:</span>
              <span className="font-mono font-bold text-white">
                {gameState.playerSharesPercent}%
              </span>
            </div>
          </div>
          <div className="text-[10px] text-white/30 border-t border-white/5 pt-2">
            Patrimônio CEO: ${Math.round(marketCap * (gameState.playerSharesPercent / 100)).toLocaleString()}
          </div>
        </div>

        {/* Valuation Card */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-mono uppercase tracking-widest">
            <span>Market Cap</span>
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-400 truncate">
              ${Math.round(marketCap).toLocaleString()}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              Receita Trimestral: ${gameState.quarterlyRevenue.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-white/30 border-t border-white/5 pt-2">
            Lucro Líquido Q: ${netQuarter.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Era Objective & Progress */}
      <div className="bg-[#1A1D24] border border-white/5 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="font-bold text-white text-base uppercase tracking-tight">
              {objective.title}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-orange-500">
            PROGRESSO: {objective.progress}%
          </span>
        </div>
        <p className="text-xs sm:text-sm text-white/60 mb-4 leading-relaxed">
          {objective.desc}
        </p>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-orange-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${objective.progress}%` }}
          />
        </div>
      </div>

      {/* Reputation Gauges & CEO Traits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reputation Pillars (Design HTML progress bar pattern) */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Pilares de Reputação Corporativa</span>
            </h4>
            {onOpenReputationModal && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenReputationModal();
                }}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-mono font-bold flex items-center gap-1 hover:underline transition"
              >
                <span>Ver Detalhes</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Public */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/70 uppercase text-[10px] font-mono">Opinião Pública & Consumidores</span>
                <span className="font-mono font-bold text-orange-400">{gameState.reputation.public}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${gameState.reputation.public}%` }}
                />
              </div>
            </div>

            {/* Investors */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/70 uppercase text-[10px] font-mono">Confiança do Mercado Financeiro</span>
                <span className="font-mono font-bold text-green-400">{gameState.reputation.investors}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${gameState.reputation.investors}%` }}
                />
              </div>
            </div>

            {/* Employees */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/70 uppercase text-[10px] font-mono flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-blue-400" />
                  Moral dos Funcionários & Cultura
                </span>
                <span className={`font-mono font-bold ${gameState.reputation.employees < 35 ? 'text-red-400' : 'text-blue-400'}`}>
                  {gameState.reputation.employees}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    gameState.reputation.employees < 35 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${gameState.reputation.employees}%` }}
                />
              </div>
            </div>

            {/* ESG */}
            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-white/70 uppercase text-[10px] font-mono flex items-center gap-1.5">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  Governança & Sustentabilidade (ESG)
                </span>
                <span className="font-mono font-bold text-yellow-500">{gameState.reputation.esg}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ width: `${gameState.reputation.esg}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CEO Moral Profile */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-wide">
              <Scale className="w-4 h-4 text-orange-500" />
              <span>Perfil Executivo de {gameState.ceoName}</span>
            </h4>
            <span className="text-[10px] text-white/40 font-mono">Doutrina de Gestão</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white/5 p-3.5 rounded-lg border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Visão Ética</div>
              <div className="text-xl font-bold text-white font-mono my-0.5">{gameState.traits.ethical}%</div>
              <div className="text-[10px] text-white/50 leading-tight">Transparência e compliance</div>
            </div>

            <div className="bg-white/5 p-3.5 rounded-lg border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Instinto Predador</div>
              <div className="text-xl font-bold text-white font-mono my-0.5">{gameState.traits.ruthless}%</div>
              <div className="text-[10px] text-white/50 leading-tight">Cortes implacáveis e agressividade</div>
            </div>

            <div className="bg-white/5 p-3.5 rounded-lg border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Apetite a Risco</div>
              <div className="text-xl font-bold text-white font-mono my-0.5">{gameState.traits.bold}%</div>
              <div className="text-[10px] text-white/50 leading-tight">Apostas altas e disrupção</div>
            </div>

            <div className="bg-white/5 p-3.5 rounded-lg border border-white/10">
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Jogo de Bastidor</div>
              <div className="text-xl font-bold text-white font-mono my-0.5">{gameState.traits.secretive}%</div>
              <div className="text-[10px] text-white/50 leading-tight">Sigilo tático e diplomacia</div>
            </div>
          </div>

          {gameState.activeCrises.length > 0 && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3">
              <div className="text-xs text-red-300">
                <span className="font-bold text-red-400">AVISO:</span> {gameState.activeCrises.length} crise crítica aguardando deliberação no Conselho!
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onNavigateTab('crises');
                }}
                className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-[11px] uppercase tracking-wider transition shrink-0"
              >
                Resolver Agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Operations Strip */}
      <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-white/60 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>Simulação executiva conectada ao Mainframe. Despache diretrizes ou avance o calendário.</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              onNavigateTab('products');
            }}
            className="px-4 py-2 rounded bg-orange-500/10 hover:bg-orange-500/20 text-xs font-bold text-orange-400 uppercase tracking-wider border border-orange-500/30 transition flex items-center gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Lançar Produto</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onAdvanceDays(7);
            }}
            disabled={isSimulating}
            className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-white uppercase tracking-wider border border-white/10 transition"
          >
            Avançar 7 Dias
          </button>
          <button
            onClick={() => {
              sounds.playMarketBell();
              onAdvanceDays(90);
            }}
            disabled={isSimulating}
            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-orange-950/40"
          >
            <span>Fechar Trimestre (+90d)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
