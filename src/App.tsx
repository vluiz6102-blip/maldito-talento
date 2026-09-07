/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import { createInitialGameState } from './data/initialState';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { NegotiationView } from './components/NegotiationView';
import { CrisesView } from './components/CrisesView';
import { DepartmentsView } from './components/DepartmentsView';
import { MarketView } from './components/MarketView';
import { ProductLaunchView } from './components/ProductLaunchView';
import { NewsFeedView } from './components/NewsFeedView';
import { TalentsView } from './components/TalentsView';
import { ReputationModal } from './components/ReputationModal';
import { DebtModal } from './components/DebtModal';
import { GameOverModal } from './components/GameOverModal';
import { advanceSimulationDays } from './utils/simulation';
import { sounds } from './utils/audio';
import { RegularStaff, DepartmentId, TalentSpecialty, TrainingProgram, HrChoice } from './types';
import { Building2, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, Music } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'ceo_empire_game_state_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initial = createInitialGameState();
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initial,
          ...parsed,
          reputation: { ...initial.reputation, ...(parsed.reputation || {}) },
          departments: { ...initial.departments, ...(parsed.departments || {}) },
          rivals: parsed.rivals && Object.keys(parsed.rivals).length > 0 ? parsed.rivals : initial.rivals,
          staffMembers: parsed.staffMembers || initial.staffMembers,
          keyTalents: parsed.keyTalents || initial.keyTalents,
          activeHrEvents: parsed.activeHrEvents || initial.activeHrEvents,
          newsFeed: parsed.newsFeed?.length ? parsed.newsFeed : initial.newsFeed,
        };
      }
    } catch {
      // ignore
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isReputationModalOpen, setIsReputationModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(() => {
    return !localStorage.getItem('ceo_empire_briefing_seen');
  });
  const [eventToasts, setEventToasts] = useState<string[]>([]);

  // Persist game state
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // ignore
    }
  }, [gameState]);

  // Advance simulation days
  const handleAdvanceDays = (days: number) => {
    setIsSimulating(true);

    setTimeout(() => {
      const result = advanceSimulationDays(gameState, days);
      setGameState(result.nextState);

      if (result.eventsTriggered.length > 0) {
        setEventToasts(result.eventsTriggered);
      }

      setIsSimulating(false);
    }, 150);
  };

  // HR & Talent Handlers
  const handleHireStaff = (candidate: Omit<RegularStaff, 'id' | 'hiredDay'>) => {
    const newStaff: RegularStaff = {
      ...candidate,
      id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hiredDay: gameState.day,
    };

    setGameState((prev) => ({
      ...prev,
      cash: Math.max(0, prev.cash - 2000), // onboarding fee
      staffMembers: [...prev.staffMembers, newStaff],
      reputation: {
        ...prev.reputation,
        employees: Math.min(100, prev.reputation.employees + 1),
      },
    }));

    setEventToasts([`Novo talento contratado: ${candidate.name} (${candidate.specialty}) alocado(a) em ${candidate.assignedDept}.`]);
  };

  const handleFireStaff = (staffId: string) => {
    const target = gameState.staffMembers.find((s) => s.id === staffId);
    if (!target) return;

    setGameState((prev) => ({
      ...prev,
      cash: Math.max(0, prev.cash - Math.round(target.salary * 0.3)), // rescisão contratual
      staffMembers: prev.staffMembers.filter((s) => s.id !== staffId),
      reputation: {
        ...prev.reputation,
        employees: Math.max(10, prev.reputation.employees - 3),
      },
    }));

    setEventToasts([`Colaborador(a) ${target.name} foi desligado(a). Rescisão paga.`]);
  };

  const handleReassignStaff = (staffId: string, dept: DepartmentId) => {
    setGameState((prev) => ({
      ...prev,
      staffMembers: prev.staffMembers.map((s) => (s.id === staffId ? { ...s, assignedDept: dept } : s)),
    }));
  };

  const handleHireKeyTalent = (talentId: string) => {
    const talent = gameState.keyTalents.find((k) => k.id === talentId);
    if (!talent || gameState.cash < talent.signingBonus) return;

    const signingNews = {
      id: `news_talent_${Date.now()}`,
      day: gameState.day,
      quarter: gameState.quarter,
      category: 'vantex' as const,
      source: 'Bloomberg Tech',
      title: `Vantex Dynamics contrata ${talent.name} para o Comitê Executivo`,
      snippet: `Contratação de peso reforça ambições da Vantex: ${talent.name} assume comando de ${talent.assignedDept} com o bônus '${talent.uniquePerk.name}'.`,
      fullContent: `Em uma manobra ousada no mercado corporativo, a Vantex Dynamics oficializou o acordo com ${talent.name}. Especialistas avaliam a contratação como um divisor de águas que acelera o valuation da empresa e eleva a confiança de investidores em Wall Street.`,
      sentiment: 'bullish' as const,
      marketImpact: '+4.2% $VNTX',
      author: 'Clarice Prado',
    };

    setGameState((prev) => ({
      ...prev,
      cash: prev.cash - talent.signingBonus,
      keyTalents: prev.keyTalents.map((k) => (k.id === talentId ? { ...k, isHired: true } : k)),
      reputation: {
        ...prev.reputation,
        investors: Math.min(100, prev.reputation.investors + 8),
        public: Math.min(100, prev.reputation.public + 5),
      },
      newsFeed: [signingNews, ...prev.newsFeed],
    }));

    setEventToasts([`Executivo(a) ${talent.name} contratado(a)! Bônus '${talent.uniquePerk.name}' ativado.`]);
  };

  const handleStartTraining = (program: TrainingProgram, targetSpecialty: TalentSpecialty | 'all') => {
    if (gameState.cash < program.cost || gameState.activeTraining) return;

    setGameState((prev) => ({
      ...prev,
      cash: prev.cash - program.cost,
      activeTraining: {
        programId: program.id,
        programName: program.name,
        targetSpecialty,
        totalDays: program.durationDays,
        daysRemaining: program.durationDays,
        skillGain: program.skillGain,
        moraleGain: program.moraleGain,
      },
    }));

    setEventToasts([`Programa de treinamento '${program.name}' iniciado para a equipe corporativa.`]);
  };

  const handleResolveHrEvent = (eventId: string, choice: HrChoice) => {
    const event = gameState.activeHrEvents.find((e) => e.id === eventId);
    if (!event) return;

    sounds.playClick();
    if (choice.cost > 0) sounds.playCashChime();

    setGameState((prev) => {
      const nextStaff = (prev.staffMembers || []).map((s) => ({
        ...s,
        morale: Math.max(10, Math.min(100, s.morale + choice.moraleDelta)),
      }));

      const rep = { ...prev.reputation };
      if (choice.reputationDelta) {
        if (choice.reputationDelta.employees !== undefined) {
          rep.employees = Math.max(0, Math.min(100, rep.employees + choice.reputationDelta.employees));
        }
        if (choice.reputationDelta.public !== undefined) {
          rep.public = Math.max(0, Math.min(100, rep.public + choice.reputationDelta.public));
        }
        if (choice.reputationDelta.investors !== undefined) {
          rep.investors = Math.max(0, Math.min(100, rep.investors + choice.reputationDelta.investors));
        }
        if (choice.reputationDelta.esg !== undefined) {
          rep.esg = Math.max(0, Math.min(100, rep.esg + choice.reputationDelta.esg));
        }
      } else {
        rep.employees = Math.max(0, Math.min(100, rep.employees + choice.moraleDelta));
      }

      return {
        ...prev,
        cash: Math.max(0, prev.cash - choice.cost),
        staffMembers: nextStaff,
        activeHrEvents: (prev.activeHrEvents || []).filter((e) => e.id !== eventId),
        reputation: rep,
      };
    });

    setEventToasts([`Dilema de RH resolvido: ${choice.label}`]);
  };

  const handleRestart = () => {
    sounds.playClick();
    const fresh = createInitialGameState();
    setGameState(fresh);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setActiveTab('dashboard');
    setIsDebtModalOpen(false);
  };

  const handleDismissBriefing = (withMusic = false) => {
    sounds.playPenSign();
    if (withMusic) {
      sounds.startBackgroundMusic();
    }
    localStorage.setItem('ceo_empire_briefing_seen', 'true');
    setShowBriefingModal(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#E0E0E0] flex flex-col font-sans selection:bg-orange-600/30 selection:text-orange-200">
      {/* Top Executive Header */}
      <Header
        gameState={gameState}
        onAdvanceDays={handleAdvanceDays}
        isSimulating={isSimulating}
        onOpenDebtModal={() => setIsDebtModalOpen(true)}
        onOpenReputationModal={() => setIsReputationModalOpen(true)}
      />

      {/* Navigation Sub-header */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveCrisis={gameState.activeCrises.length > 0}
        unreadNewsCount={gameState.newsFeed.length}
        activeHrEventsCount={gameState.activeHrEvents?.length || 0}
      />

      {/* Toast Notification Strip */}
      {eventToasts.length > 0 && (
        <div className="bg-[#14161C] border-b border-white/10 px-4 py-2 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 overflow-x-auto text-orange-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{eventToasts[0]}</span>
            {eventToasts.length > 1 && (
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/40 shrink-0">
                +{eventToasts.length - 1} outros eventos
              </span>
            )}
          </div>
          <button
            onClick={() => setEventToasts([])}
            className="text-white/40 hover:text-white text-[11px] shrink-0 font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Corporate Operations Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            gameState={gameState}
            onNavigateTab={setActiveTab}
            onOpenDebtModal={() => setIsDebtModalOpen(true)}
            onOpenReputationModal={() => setIsReputationModalOpen(true)}
            onAdvanceDays={handleAdvanceDays}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'products' && (
          <ProductLaunchView
            gameState={gameState}
            onUpdateGameState={setGameState}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'negotiation' && (
          <NegotiationView
            gameState={gameState}
            onUpdateGameState={setGameState}
          />
        )}

        {activeTab === 'crises' && (
          <CrisesView
            gameState={gameState}
            onUpdateGameState={setGameState}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsView
            gameState={gameState}
            onUpdateGameState={setGameState}
          />
        )}

        {activeTab === 'talents' && (
          <TalentsView
            gameState={gameState}
            onHireStaff={handleHireStaff}
            onFireStaff={handleFireStaff}
            onReassignStaff={handleReassignStaff}
            onHireKeyTalent={handleHireKeyTalent}
            onStartTraining={handleStartTraining}
            onResolveHrEvent={handleResolveHrEvent}
          />
        )}

        {activeTab === 'market' && (
          <MarketView
            gameState={gameState}
            onUpdateGameState={setGameState}
          />
        )}

        {activeTab === 'news' && (
          <NewsFeedView
            articles={gameState.newsFeed}
            currentDay={gameState.day}
            currentQuarter={gameState.quarter}
          />
        )}
      </main>

      {/* Mainframe Status Footer */}
      <footer className="h-12 bg-[#0F1115] border-t border-white/10 px-4 sm:px-6 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-[2px] font-medium shrink-0">
        <div>Conectado: Mainframe Vantex v4.2.1</div>
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => {
              sounds.playClick();
              setIsReputationModalOpen(true);
            }}
            className="flex items-center gap-2 hover:text-white transition cursor-pointer"
            title="Abrir painel de Governança & ESG"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            ESG: {gameState.reputation.esg}%
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setIsReputationModalOpen(true);
            }}
            className="hidden md:flex items-center gap-2 hover:text-white transition cursor-pointer"
            title="Abrir painel de Moral dos Funcionários"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Moral: {gameState.reputation.employees}%
          </button>
          <span className="hidden sm:inline">Versão: Executiva 2026.09</span>
        </div>
      </footer>

      {/* Debt & Bank Repayment Modal */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        gameState={gameState}
        onUpdateGameState={setGameState}
        onNavigateToNegotiation={() => {
          setIsDebtModalOpen(false);
          setActiveTab('negotiation');
        }}
      />

      {/* Reputation & Stakeholders Modal */}
      {isReputationModalOpen && (
        <ReputationModal
          gameState={gameState}
          onClose={() => setIsReputationModalOpen(false)}
        />
      )}

      {/* Game Over / Victory Modal */}
      <GameOverModal
        isOpen={gameState.isGameOver}
        gameState={gameState}
        onRestart={handleRestart}
      />

      {/* Day 1 CEO Briefing Induction Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0E]/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#14161C] border border-white/10 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 text-left relative">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center font-serif font-black text-2xl shadow-lg shadow-orange-900/40">
                V
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-mono text-orange-500 font-bold">
                  CONSELHO DE ADMINISTRAÇÃO • VANTEX DYNAMICS
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                  Termo de Posse Executiva
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A1D24] border border-white/5 space-y-2 text-xs sm:text-sm text-white/70 leading-relaxed">
              <p>
                Prezado(a) <strong className="text-white">{gameState.ceoName}</strong>,
              </p>
              <p>
                O ex-CEO Arthur Vance desapareceu no exterior após maquiar nossos balanços e deixar a Vantex Dynamics à beira da falência. Você acaba de ser nomeado(a) diretor-presidente interino.
              </p>
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5 my-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="text-red-300">ULTIMATO:</strong> O banco estatal <strong>Confiança Federal</strong> deu <strong>90 dias</strong> para quitarmos ou renegociarmos a dívida de <strong>$500.000</strong>. Se falharmos, a liquidação judicial é automática.
                </div>
              </div>
              <p>
                Sua missão: sobreviver à garagem, gerenciar orçamentos de engenharia e marketing, negociar com credores e tubarões de Wall Street via IA, e transformar a Vantex em um império corporativo global!
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleDismissBriefing(true)}
                className="w-full py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-500 uppercase font-bold text-xs tracking-wider shadow-xl shadow-orange-950/40 transition flex items-center justify-center gap-2"
              >
                <Music className="w-4 h-4 text-orange-200 animate-pulse" />
                <span>Entrar na Diretoria com Trilha Sonora (Lo-Fi)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <button
                onClick={() => handleDismissBriefing(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white uppercase font-semibold text-[11px] tracking-wider transition flex items-center justify-center gap-1.5"
              >
                <span>Entrar sem Música de Fundo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
