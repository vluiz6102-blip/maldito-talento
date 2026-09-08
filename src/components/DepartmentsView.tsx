import React, { useState } from 'react';
import { GameState, Departments } from '../types';
import { 
  Briefcase, 
  Code2, 
  Megaphone, 
  Users, 
  Scale, 
  Cpu, 
  DollarSign, 
  ArrowUpCircle, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface DepartmentsViewProps {
  gameState: GameState;
  onUpdateGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  gameState,
  onUpdateGameState,
}) => {
  const departments = gameState.departments;
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setActionFeedback({ message, type });
  };

  const handleBudgetChange = (deptKey: keyof Departments, newBudget: number) => {
    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    nextState.departments[deptKey].budget = newBudget;

    // Recalculate effectiveness based on budget adequacy
    const baseBudget = deptKey === 'product' ? 15000 : deptKey === 'marketing' ? 10000 : 8000;
    const ratio = newBudget / baseBudget;
    nextState.departments[deptKey].effectiveness = Math.min(100, Math.max(20, Math.round(50 * ratio)));

    // Update total quarterly expenses
    nextState.quarterlyExpenses = 
      nextState.departments.product.budget +
      nextState.departments.marketing.budget +
      nextState.departments.hr.budget +
      nextState.departments.legal.budget +
      nextState.departments.rd.budget;

    onUpdateGameState(nextState);
  };

  const handleUpgradeDept = (deptKey: keyof Departments) => {
    const cost = departments[deptKey].level * 25000;
    if (gameState.cash < cost) {
      sounds.playWarningBeep();
      showNotification(`Caixa insuficiente! O upgrade para nível ${departments[deptKey].level + 1} custa $${cost.toLocaleString()}.`, 'error');
      return;
    }

    sounds.playCashChime();
    const nextState: GameState = JSON.parse(JSON.stringify(gameState));
    nextState.cash -= cost;
    nextState.departments[deptKey].level += 1;
    nextState.departments[deptKey].effectiveness = Math.min(100, nextState.departments[deptKey].effectiveness + 15);
    nextState.departments[deptKey].headcount += 2;

    showNotification(`Departamento promovido com sucesso para o Nível ${nextState.departments[deptKey].level}! Efetividade e equipe ampliadas.`, 'success');
    onUpdateGameState(nextState);
  };

  const handleSpecialAction = (deptKey: keyof Departments) => {
    sounds.playClick();
    const nextState: GameState = JSON.parse(JSON.stringify(gameState));

    if (deptKey === 'product') {
      const cost = 30000;
      if (gameState.cash < cost) {
        sounds.playWarningBeep();
        showNotification('Caixa insuficiente ($30.000 necessários para nova versão)!', 'error');
        return;
      }
      nextState.cash -= cost;
      nextState.departments.product.productQuality += 15;
      nextState.quarterlyRevenue += 45000;
      nextState.departments.product.currentProduct = `Vantex Core v${(nextState.departments.product.level + 0.1 * Math.floor(nextState.day / 90)).toFixed(1)} Pro`;
      sounds.playSuccessChime();
      showNotification('Nova versão do Vantex Core compilada com sucesso! Faturamento trimestral ampliado em +$45.000.', 'success');
    } else if (deptKey === 'marketing') {
      const cost = 20000;
      if (gameState.cash < cost) {
        sounds.playWarningBeep();
        showNotification('Caixa insuficiente ($20.000 necessários para campanha viral)!', 'error');
        return;
      }
      nextState.cash -= cost;
      nextState.departments.marketing.brandAwareness = Math.min(100, nextState.departments.marketing.brandAwareness + 18);
      nextState.reputation.public = Math.min(100, nextState.reputation.public + 10);
      sounds.playMarketBell();
      showNotification('Campanha viral deflagrada! Reconhecimento da marca subiu para ' + nextState.departments.marketing.brandAwareness + '%.', 'success');
    } else if (deptKey === 'hr') {
      const cost = 25000;
      if (gameState.cash < cost) {
        sounds.playWarningBeep();
        showNotification('Caixa insuficiente ($25.000 necessários para bônus de equipe)!', 'error');
        return;
      }
      nextState.cash -= cost;
      nextState.departments.hr.employeeMoral = Math.min(100, nextState.departments.hr.employeeMoral + 25);
      nextState.reputation.employees = Math.min(100, nextState.reputation.employees + 20);
      sounds.playCashChime();
      showNotification('Bônus corporativos distribuídos! A moral da equipe disparou para ' + nextState.departments.hr.employeeMoral + '%.', 'success');
    } else if (deptKey === 'legal') {
      const cost = 20000;
      if (gameState.cash < cost) {
        sounds.playWarningBeep();
        showNotification('Caixa insuficiente ($20.000 necessários para auditoria)!', 'error');
        return;
      }
      nextState.cash -= cost;
      nextState.departments.legal.litigationRisk = Math.max(10, nextState.departments.legal.litigationRisk - 30);
      nextState.departments.legal.auditProtection = Math.min(100, nextState.departments.legal.auditProtection + 25);
      sounds.playGavelStrike();
      showNotification('Auditoria preventiva concluída! Risco de processos reduzido para ' + nextState.departments.legal.litigationRisk + '%.', 'success');
    } else if (deptKey === 'rd') {
      const cost = 35000;
      if (gameState.cash < cost) {
        sounds.playWarningBeep();
        showNotification('Caixa insuficiente ($35.000 necessários para registro de patente)!', 'error');
        return;
      }
      nextState.cash -= cost;
      nextState.departments.rd.patentsCount += 1;
      nextState.stockPrice = Number((nextState.stockPrice * 1.12).toFixed(2));
      sounds.playSuccessChime();
      showNotification('Nova patente de arquitetura de IA registrada no INPI! Ações $VNTX valorizaram +12%.', 'success');
    }

    onUpdateGameState(nextState);
  };

  const deptList = [
    {
      key: 'product' as const,
      name: 'Produto & Engenharia',
      icon: Code2,
      color: 'text-amber-400',
      actionLabel: 'Lançar Upgrade do Vantex Core ($30k)',
      specialMetric: `Qualidade: ${departments.product.productQuality}/100`,
      statusText: departments.product.currentProduct,
    },
    {
      key: 'marketing' as const,
      name: 'Marketing & Relações Públicas',
      icon: Megaphone,
      color: 'text-cyan-400',
      actionLabel: 'Disparar Campanha Viral de PR ($20k)',
      specialMetric: `Reconhecimento da Marca: ${departments.marketing.brandAwareness}%`,
      statusText: departments.marketing.activeCampaign,
    },
    {
      key: 'hr' as const,
      name: 'Recursos Humanos & Cultura',
      icon: Users,
      color: 'text-indigo-400',
      actionLabel: 'Distribuir Bônus de Retenção ($25k)',
      specialMetric: `Moral da Equipe: ${departments.hr.employeeMoral}/100`,
      statusText: departments.hr.talentTier,
    },
    {
      key: 'legal' as const,
      name: 'Jurídico & Compliance Anti-CVM',
      icon: Scale,
      color: 'text-purple-400',
      actionLabel: 'Blindagem e Auditoria Preventiva ($20k)',
      specialMetric: `Risco de Processos: ${departments.legal.litigationRisk}%`,
      statusText: departments.legal.activeStatus,
    },
    {
      key: 'rd' as const,
      name: 'Pesquisa & Desenvolvimento (P&D)',
      icon: Cpu,
      color: 'text-emerald-400',
      actionLabel: 'Registrar Nova Patente de IA ($35k)',
      specialMetric: `Patentes Ativas: ${departments.rd.patentsCount}`,
      statusText: departments.rd.activeStatus,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-all animate-fadeIn ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-slate-100 text-base flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <span>Gestão Departamental & Alocação de Orçamento</span>
          </h3>
          <p className="text-xs text-slate-400">
            Ajuste os orçamentos trimestrais de cada área. Eficácia alta alavanca receitas e reduz riscos de escândalo.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Orçamento Trimestral Total</div>
          <div className="text-xl font-mono font-bold text-amber-400">
            ${gameState.quarterlyExpenses.toLocaleString()}/tri
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deptList.map((dept) => {
          const stats = departments[dept.key];
          const Icon = dept.icon;
          const upgradeCost = stats.level * 25000;

          return (
            <div
              key={dept.key}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <Icon className={`w-4 h-4 ${dept.color}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{dept.name}</h4>
                      <div className="text-[11px] text-slate-400">
                        Nível {stats.level} • {stats.headcount} Especialistas
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgradeDept(dept.key)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium text-[11px] border border-slate-700 transition flex items-center gap-1"
                  >
                    <ArrowUpCircle className="w-3 h-3" />
                    <span>Nvl {stats.level + 1} (${upgradeCost / 1000}k)</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 space-y-1 my-3 text-xs">
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-400">Status Operacional:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">{dept.statusText}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-400">Métrica Chave:</span>
                    <span className="font-mono font-bold text-amber-300">{dept.specialMetric}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex justify-between">
                    <span className="text-slate-400">Eficácia Departamental:</span>
                    <span className="font-mono font-bold text-emerald-400">{stats.effectiveness}%</span>
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Alocação Trimestral:</span>
                    <span className="font-mono font-bold text-slate-200">${stats.budget.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={4000}
                    max={80000}
                    step={1000}
                    value={stats.budget}
                    onChange={(e) => handleBudgetChange(dept.key, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>$4k (Mínimo)</span>
                    <span>$80k (Pesado)</span>
                  </div>
                </div>
              </div>

              {/* Special Action Button */}
              <button
                onClick={() => handleSpecialAction(dept.key)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-amber-300 font-semibold text-xs border border-slate-700/80 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{dept.actionLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
