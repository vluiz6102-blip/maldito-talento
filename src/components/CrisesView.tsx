import React, { useState } from 'react';
import { GameState, CrisisEvent, CrisisChoice } from '../types';
import { 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  ShieldAlert, 
  History,
  Lock
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface CrisesViewProps {
  gameState: GameState;
  onUpdateGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const CrisesView: React.FC<CrisesViewProps> = React.memo(({
  gameState,
  onUpdateGameState,
}) => {
  const [selectedCrisisId, setSelectedCrisisId] = useState<string | null>(
    gameState.activeCrises[0]?.id || null
  );
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const activeCrises = gameState.activeCrises;
  const currentCrisis = activeCrises.find(c => c.id === selectedCrisisId) || activeCrises[0];

  const handleSelectChoice = (crisis: CrisisEvent, choice: CrisisChoice) => {
    if (isProcessing) return;
    // Check requirements
    if (choice.requirements?.minCash && gameState.cash < choice.requirements.minCash) {
      sounds.playWarningBeep();
      setWarningNotice(`Caixa insuficiente! Você precisa de $${choice.requirements.minCash.toLocaleString()} para executar esta opção.`);
      return;
    }
    setWarningNotice(null);
    setIsProcessing(true);

    sounds.playGavelStrike();
    sounds.playCashChime();

    onUpdateGameState((prev: GameState) => {
      const nextState: GameState = JSON.parse(JSON.stringify(prev));

      // Remove from active crises
      nextState.activeCrises = nextState.activeCrises.filter(c => c.id !== crisis.id);

      // Record in history
      nextState.resolvedCrisisHistory.push({
        crisisId: crisis.id,
        choiceId: choice.id,
        day: nextState.day,
      });

      // Apply financial & stats outcomes
      const outcomes = choice.outcomes;
      nextState.cash += outcomes.cashDelta;
      if (nextState.cash < 0) {
        nextState.debt += Math.abs(nextState.cash);
        nextState.cash = 0;
      }
      
      if (outcomes.debtDelta !== 0) {
        nextState.debt = Math.max(0, nextState.debt + outcomes.debtDelta);
      }
      if (outcomes.debtDaysDelta !== 0) {
        nextState.debtDeadlineDays += outcomes.debtDaysDelta;
      }
      if (outcomes.stockPriceDelta !== 0) {
        nextState.stockPrice = Math.max(0.20, Number((nextState.stockPrice + outcomes.stockPriceDelta).toFixed(2)));
      }

      // Apply reputation deltas
      if (outcomes.reputationDeltas) {
        if (outcomes.reputationDeltas.public) nextState.reputation.public = Math.max(0, Math.min(100, nextState.reputation.public + outcomes.reputationDeltas.public));
        if (outcomes.reputationDeltas.investors) nextState.reputation.investors = Math.max(0, Math.min(100, nextState.reputation.investors + outcomes.reputationDeltas.investors));
        if (outcomes.reputationDeltas.employees) nextState.reputation.employees = Math.max(0, Math.min(100, nextState.reputation.employees + outcomes.reputationDeltas.employees));
        if (outcomes.reputationDeltas.esg) nextState.reputation.esg = Math.max(0, Math.min(100, nextState.reputation.esg + outcomes.reputationDeltas.esg));
      }

      // Apply trait deltas
      if (outcomes.traitDeltas) {
        if (outcomes.traitDeltas.ethical) nextState.traits.ethical = Math.max(0, Math.min(100, nextState.traits.ethical + outcomes.traitDeltas.ethical));
        if (outcomes.traitDeltas.ruthless) nextState.traits.ruthless = Math.max(0, Math.min(100, nextState.traits.ruthless + outcomes.traitDeltas.ruthless));
        if (outcomes.traitDeltas.bold) nextState.traits.bold = Math.max(0, Math.min(100, nextState.traits.bold + outcomes.traitDeltas.bold));
        if (outcomes.traitDeltas.secretive) nextState.traits.secretive = Math.max(0, Math.min(100, nextState.traits.secretive + outcomes.traitDeltas.secretive));
      }

      // Add News Article
      nextState.newsFeed.unshift({
        id: `news_crisis_${Date.now()}`,
        day: nextState.day,
        quarter: nextState.quarter,
        source: 'TechPulse News',
        title: outcomes.headline,
        snippet: outcomes.narrativeResolution,
        sentiment: outcomes.stockPriceDelta >= 0 ? 'bullish' : 'bearish',
      });

      return nextState;
    });

    setResolvedNotice(currentCrisis.choices.find(c => c.id === choice.id)?.outcomes.narrativeResolution || null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Resolved Feedback Banner */}
      {resolvedNotice && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start justify-between gap-3 text-green-300 animate-fadeIn shadow-xl">
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="font-bold flex items-center gap-1.5 text-green-400 uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4" />
              <span>Veredito Executivo Homologado no Conselho</span>
            </div>
            <p className="text-white/80">{resolvedNotice}</p>
          </div>
          <button
            onClick={() => setResolvedNotice(null)}
            className="text-white/40 hover:text-white text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Warning Notice Banner */}
      {warningNotice && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start justify-between gap-3 text-red-300 animate-fadeIn shadow-xl font-mono text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{warningNotice}</span>
          </div>
          <button
            onClick={() => setWarningNotice(null)}
            className="text-white/50 hover:text-white text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Crisis Dilemma Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-xl">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2 uppercase tracking-wide">
            <Scale className="w-5 h-5 text-orange-500" />
            <span>Conselho de Administração & Dilemas Estratégicos</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
            Dilemas corporativos reais com ramificações irreversíveis em sua reputação, traços éticos e valor de mercado.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/40 uppercase font-mono text-[10px] tracking-wider">Crises pendentes:</span>
          <span className="px-2.5 py-0.5 rounded bg-white/5 text-orange-400 font-bold font-mono border border-white/10">
            {activeCrises.length}
          </span>
        </div>
      </div>

      {activeCrises.length === 0 ? (
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-12 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-white text-lg uppercase tracking-tight">
            Nenhuma Crise Crítica no Conselho
          </h4>
          <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">
            As operações da Vantex Dynamics estão correndo dentro da normalidade corporativa. Avance o tempo de operações (+7 dias ou Fechar Trimestre) para colher resultados e enfrentar novos eventos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeCrises.map((crisis) => (
            <div
              key={crisis.id}
              className="bg-[#14161C] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0F1115] flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px] uppercase tracking-wider border border-red-500/30 flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      Urgência Máxima
                    </span>
                    <span className="text-[11px] text-white/40 uppercase font-mono font-bold tracking-wider">
                      Origem: Departamento {crisis.sourceDept.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">
                    {crisis.title}
                  </h4>
                </div>
                <div className="px-3 py-1 rounded bg-white/5 text-orange-400 font-mono text-xs border border-white/10 uppercase">
                  Era: {crisis.era.toUpperCase()}
                </div>
              </div>

              {/* Description & Flavor Quote */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                  {crisis.description}
                </p>

                <blockquote className="p-3.5 rounded-lg bg-[#0A0B0E] border-l-4 border-orange-500 text-xs italic text-white/70">
                  {crisis.flavorQuote}
                </blockquote>

                {/* Branching Choices Grid */}
                <div className="pt-2 space-y-3">
                  <div className="text-xs font-bold text-white/40 uppercase tracking-wider font-mono">
                    Opções Executivas de Decisão:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {crisis.choices.map((choice) => {
                      const canAfford = !choice.requirements?.minCash || gameState.cash >= choice.requirements.minCash;

                      return (
                        <div
                          key={choice.id}
                          className="bg-[#1A1D24] border border-white/5 hover:border-orange-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all group shadow-md"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded bg-white/10 text-orange-400 text-[10px] font-mono font-bold uppercase">
                                {choice.traitBadge}
                              </span>
                              {choice.requirements?.minCash && (
                                <span className={`text-[10px] font-mono font-bold ${canAfford ? 'text-white/40' : 'text-red-400 flex items-center gap-1'}`}>
                                  {!canAfford && <Lock className="w-3 h-3" />}
                                  Custo: ${choice.requirements.minCash.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-white text-sm group-hover:text-orange-400 transition uppercase tracking-tight">
                              {choice.label}
                            </h5>

                            <p className="text-xs text-white/70 leading-relaxed">
                              {choice.description}
                            </p>
                          </div>

                          {/* Projected Consequence Pills */}
                          <div className="space-y-3 pt-2 border-t border-white/5">
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                              {choice.outcomes.cashDelta !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${
                                  choice.outcomes.cashDelta > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                }`}>
                                  Caixa: {choice.outcomes.cashDelta > 0 ? '+' : ''}${choice.outcomes.cashDelta.toLocaleString()}
                                </span>
                              )}
                              {choice.outcomes.debtDaysDelta !== 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                  Prazo Dívida: +{choice.outcomes.debtDaysDelta}d
                                </span>
                              )}
                              {choice.outcomes.stockPriceDelta !== 0 && (
                                <span className={`px-1.5 py-0.5 rounded ${
                                  choice.outcomes.stockPriceDelta > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                }`}>
                                  Ação: {choice.outcomes.stockPriceDelta > 0 ? '+' : ''}${choice.outcomes.stockPriceDelta.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleSelectChoice(crisis, choice)}
                              disabled={!canAfford || isProcessing}
                              className="w-full py-2.5 rounded bg-orange-600 hover:bg-orange-500 active:scale-[0.98] disabled:opacity-30 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-orange-950/40"
                            >
                              {!canAfford ? 'Fundos Insuficientes' : isProcessing ? 'Processando...' : 'Ratificar Escolha no Conselho'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crisis History */}
      {gameState.resolvedCrisisHistory.length > 0 && (
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wide">
            <History className="w-4 h-4 text-orange-500" />
            <span>Registro Histórico de Resoluções do Conselho</span>
          </div>
          <div className="space-y-2">
            {gameState.resolvedCrisisHistory.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-white/80 font-medium">Decisão executiva protocolada</span>
                </div>
                <span className="font-mono text-white/40 text-[11px]">Dia {item.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.gameState.activeCrises === next.gameState.activeCrises &&
         prev.gameState.resolvedCrisisHistory === next.gameState.resolvedCrisisHistory &&
         prev.gameState.cash === next.gameState.cash;
});
