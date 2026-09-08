import React, { useState } from 'react';
import { GameState } from '../types';
import { X, Building2, DollarSign, AlertTriangle, CheckCircle2, MessagesSquare } from 'lucide-react';
import { makeDebtPayment } from '../utils/simulation';
import { sounds } from '../utils/audio';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onUpdateGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onNavigateToNegotiation: () => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onUpdateGameState,
  onNavigateToNegotiation,
}) => {
  const [customAmount, setCustomAmount] = useState<number>(50000);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = (amount: number) => {
    const res = makeDebtPayment(gameState, amount);
    setFeedback(res.message);
    if (res.success) {
      onUpdateGameState(res.nextState);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#14161C] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-white text-lg uppercase tracking-wide">
              Amortização Bancária — Confiança Federal
            </h3>
          </div>
          <p className="text-xs text-white/50">
            Contrato de Mútuo Corporativo nº 8829-CF. Juros correntes de 3.5% ao trimestre.
          </p>
        </div>

        {/* Debt Status Card */}
        <div className="p-4 rounded-xl bg-[#0A0B0E] border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 font-bold uppercase font-mono">Saldo Devedor Atual</div>
            <div className="text-2xl font-mono font-bold text-red-400">
              ${gameState.debt.toLocaleString()}
            </div>
            <div className="text-xs text-white/50 mt-0.5 font-mono">
              Prazo limite: <strong className="text-orange-400">{gameState.debtDeadlineDays} dias</strong>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/40 font-bold uppercase font-mono">Seu Caixa Disponível</div>
            <div className="text-xl font-mono font-bold text-green-400">
              ${Math.round(gameState.cash).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 font-mono">
            {feedback}
          </div>
        )}

        {/* Quick Payment Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono">Amortizações Rápidas:</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePay(25000)}
              disabled={gameState.cash < 25000 || gameState.debt <= 0}
              className="py-2.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white text-xs font-mono font-bold border border-white/10 transition"
            >
              -$25.000
            </button>
            <button
              onClick={() => handlePay(50000)}
              disabled={gameState.cash < 50000 || gameState.debt <= 0}
              className="py-2.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white text-xs font-mono font-bold border border-white/10 transition"
            >
              -$50.000
            </button>
            <button
              onClick={() => handlePay(100000)}
              disabled={gameState.cash < 100000 || gameState.debt <= 0}
              className="py-2.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white text-xs font-mono font-bold border border-white/10 transition"
            >
              -$100.000
            </button>
          </div>

          <button
            onClick={() => handlePay(gameState.debt)}
            disabled={gameState.cash < gameState.debt || gameState.debt <= 0}
            className="w-full py-3 rounded bg-white text-black hover:bg-orange-500 hover:text-white disabled:opacity-30 font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-1.5 mt-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Quitar Dívida Integralmente (${gameState.debt.toLocaleString()})</span>
          </button>
        </div>

        {/* Alternative Negotiation Action */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-white uppercase tracking-tight">Sem caixa para amortizar agora?</span>
            <p className="text-[11px] text-white/50">
              Converse com o Dr. Osvaldo Barreto no chat com IA e peça moratória ou reescalonamento.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onNavigateToNegotiation();
            }}
            className="px-3.5 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs uppercase tracking-wide transition flex items-center gap-1.5 shrink-0 ml-2"
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            <span>Negociar IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
