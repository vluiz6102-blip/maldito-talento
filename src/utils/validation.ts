import { GameState } from '../types';

export function validarNumero(valor: unknown, fallback: number): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }
  if (typeof valor === 'string') {
    const parsed = parseFloat(valor);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function clampGameState(state: GameState): GameState {
  return {
    ...state,
    cash: validarNumero(state.cash, 0),
    debt: validarNumero(state.debt, 0),
    debtDeadlineDays: Math.max(0, validarNumero(state.debtDeadlineDays, 0)),
    stockPrice: Math.max(0, validarNumero(state.stockPrice, 0.2)),
    quarterlyRevenue: validarNumero(state.quarterlyRevenue, 0),
    quarterlyExpenses: validarNumero(state.quarterlyExpenses, 0),
    reputation: {
      public: Math.max(0, Math.min(100, validarNumero(state.reputation.public, 50))),
      investors: Math.max(0, Math.min(100, validarNumero(state.reputation.investors, 50))),
      employees: Math.max(0, Math.min(100, validarNumero(state.reputation.employees, 50))),
      customers: Math.max(0, Math.min(100, validarNumero(state.reputation.customers, 50))),
      esg: Math.max(0, Math.min(100, validarNumero(state.reputation.esg, 50))),
    },
    conselho: {
      ...state.conselho,
      confianca: Math.max(0, Math.min(100, validarNumero(state.conselho.confianca, 60))),
    }
  };
}
