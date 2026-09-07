import React from 'react';
import { GameState } from '../types';
import { sounds } from '../utils/audio';
import { 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Leaf, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  DollarSign,
  Briefcase
} from 'lucide-react';

interface ReputationModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const ReputationModal: React.FC<ReputationModalProps> = ({ gameState, onClose }) => {
  const { reputation, departments, stockPrice } = gameState;

  // Impact calculations
  const customerTrustBonusPct = ((reputation.public - 50) * 0.6).toFixed(1);
  const employeeMoraleBonusPct = ((reputation.employees - 50) * 0.5).toFixed(1);
  const investorMultiple = (0.7 + (reputation.investors / 100) * 0.6).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12151E] border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Painel Executivo de Reputação & Stakeholders</h2>
              <p className="text-xs text-zinc-400">
                Métricas detalhadas de confiança, moral e relações que governam a sobrevivência da Vantex
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Pillar 1: Customer Trust */}
          <div className="bg-[#101218] border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-zinc-200">Confiança do Consumidor (Customer Trust)</h3>
              </div>
              <span className={`text-base font-bold font-mono ${reputation.public >= 60 ? 'text-emerald-400' : reputation.public < 40 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {reputation.public} / 100
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  reputation.public >= 60 ? 'bg-cyan-500' : reputation.public < 40 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${reputation.public}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B0D12] p-3 rounded-lg border border-zinc-800/60">
              <div>
                <span className="text-zinc-500 block text-[11px]">Impacto no Faturamento:</span>
                <span className={`font-semibold ${Number(customerTrustBonusPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Number(customerTrustBonusPct) >= 0 ? `+${customerTrustBonusPct}%` : `${customerTrustBonusPct}%`} nas vendas trimestrais
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Como Influenciar:</span>
                <span className="text-zinc-300">
                  Lançar produtos com alta qualidade ({departments.product.productQuality}/100), campanhas de marketing transparentes e resolver crises sem prejudicar clientes.
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Employee Morale */}
          <div className="bg-[#101218] border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-zinc-200">Moral dos Colaboradores (Employee Morale)</h3>
              </div>
              <span className={`text-base font-bold font-mono ${reputation.employees >= 60 ? 'text-emerald-400' : reputation.employees < 40 ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}`}>
                {reputation.employees} / 100
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  reputation.employees >= 60 ? 'bg-indigo-500' : reputation.employees < 40 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${reputation.employees}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B0D12] p-3 rounded-lg border border-zinc-800/60">
              <div>
                <span className="text-zinc-500 block text-[11px]">Impacto em Produtividade:</span>
                <span className={`font-semibold ${Number(employeeMoraleBonusPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Number(employeeMoraleBonusPct) >= 0 ? `+${employeeMoraleBonusPct}%` : `${employeeMoraleBonusPct}%`} na efetividade dos departamentos
                </span>
                {reputation.employees < 40 && (
                  <span className="block text-[10px] text-rose-400 font-bold mt-1">
                    ⚠️ RISCO IMINENTE DE GREVE GERAL DO SINDICATO!
                  </span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Como Influenciar:</span>
                <span className="text-zinc-300">
                  Programas de treinamento contínuo, orçamentos justos de RH, evitar demissões em massa e honrar pedidos de aumento salarial.
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Investor Relations */}
          <div className="bg-[#101218] border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-200">Relações com Investidores (Investor Relations)</h3>
              </div>
              <span className={`text-base font-bold font-mono ${reputation.investors >= 60 ? 'text-emerald-400' : reputation.investors < 40 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {reputation.investors} / 100
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  reputation.investors >= 60 ? 'bg-emerald-500' : reputation.investors < 40 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${reputation.investors}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#0B0D12] p-3 rounded-lg border border-zinc-800/60">
              <div>
                <span className="text-zinc-500 block text-[11px]">Múltiplo de Valuation:</span>
                <span className="font-semibold text-emerald-400">
                  {investorMultiple}x sobre patrimônio líquido (Ações a ${stockPrice.toFixed(2)})
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Como Influenciar:</span>
                <span className="text-zinc-300">
                  Amortizar parcelas de dívida bancária pontualmente, divulgar balanços lucrativos e atrair talentos do C-Suite.
                </span>
              </div>
            </div>
          </div>

          {/* Pillar 4: Corporate Governance & ESG */}
          <div className="bg-[#101218] border border-zinc-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-200">Governança Corporativa & ESG</h3>
              </div>
              <span className="text-base font-bold font-mono text-zinc-200">
                {reputation.esg} / 100
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${reputation.esg}%` }}
              />
            </div>

            <div className="text-xs text-zinc-400 bg-[#0B0D12] p-3 rounded-lg border border-zinc-800/60 leading-relaxed">
              Pontuação elevada em ESG protege a Vantex contra processos e auditorias predatórias de concorrentes como Amazora e Metaphase, além de desbloquear o <strong className="text-emerald-400">Final Visionário Ético</strong> no Conselho de Administração.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-3 flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
