import { GameState } from '../types';
import { INITIAL_RIVAL_BRANDS } from './brands';
import { GAME_CRISES } from './crises';
import { INITIAL_STAFF, AVAILABLE_KEY_TALENTS } from './talents';
import { INITIAL_NEWS_ARTICLES } from './news';

export function createInitialGameState(ceoName = 'Alex Mercer'): GameState {
  const initialStockHistory = [
    { day: -30, price: 12.50, event: 'Fraude Arthur Vance vem à tona' },
    { day: -15, price: 6.20, event: 'Ações despencam com sumiço do CEO' },
    { day: 0, price: 3.40, event: 'Novo CEO nomeado às pressas' },
    { day: 1, price: 3.40 },
  ];

  return {
    companyName: 'Vantex Dynamics',
    ceoName,
    era: 'garage',
    day: 1,
    quarter: 1,
    debtDeadlineDays: 90,
    initialDebt: 500000,
    debt: 500000,
    cash: 85000,
    stockPrice: 3.40,
    sharesTotal: 1000000,
    playerSharesPercent: 65,
    quarterlyRevenue: 95000,
    quarterlyExpenses: 50000, // department sum
    reputation: {
      public: 48,      // Customer Trust (neutral start)
      investors: 35,   // Investor Relations (low due to Vance debt)
      employees: 52,   // Employee Morale (neutral)
      customers: 50,   // Customer satisfaction
      esg: 45,         // Corporate Governance
    },
    traits: {
      ethical: 50,
      ruthless: 50,
      bold: 50,
      secretive: 50,
    },
    conselho: {
      confianca: 60,
      trimestresConsecutivosCriticos: 0,
      ultimaVotacao: null,
      membros: [
        { nome: 'Elias Barreto', cargo: 'Presidente do Conselho', prioridade: 'lucro', satisfacaoIndividual: 60 },
        { nome: 'Olivia Stone', cargo: 'Rep. Acionistas Minoritários', prioridade: 'reputacao', satisfacaoIndividual: 60 },
        { nome: 'Dr. Akira Lins', cargo: 'Conselheiro Independente (Tech)', prioridade: 'inovacao', satisfacaoIndividual: 60 },
        { nome: 'Helena Vance', cargo: 'Herdeira / Conselheira', prioridade: 'etica', satisfacaoIndividual: 60 },
      ]
    },
    scandalHeat: 45,
    departments: {
      product: {
        budget: 15000,
        level: 1,
        effectiveness: 60,
        headcount: 4,
        activeStatus: 'Otimizando MVP do Vantex Core',
        currentProduct: 'Vantex Core v1.0 Beta',
        productQuality: 55,
      },
      marketing: {
        budget: 8000,
        level: 1,
        effectiveness: 45,
        headcount: 2,
        activeStatus: 'Gestão de crise nas redes sociais',
        brandAwareness: 22,
        activeCampaign: 'Contenção de Danos Vance',
      },
      hr: {
        budget: 10000,
        level: 1,
        effectiveness: 50,
        headcount: 1,
        activeStatus: 'Controlando pânico e pizza grátis no overtime',
        employeeMoral: 52,
        talentTier: 'Garagem Devs (Veteranos Exaustos)',
      },
      legal: {
        budget: 7000,
        level: 1,
        effectiveness: 40,
        headcount: 1,
        activeStatus: 'Contestando notificações extrajudiciais do banco',
        litigationRisk: 70,
        auditProtection: 35,
      },
      rd: {
        budget: 10000,
        level: 1,
        effectiveness: 55,
        headcount: 2,
        activeStatus: 'Engenharia reversa em algoritmos de compressão',
        techBreakthroughs: 1,
        patentsCount: 1,
      },
    },
    rivals: JSON.parse(JSON.stringify(INITIAL_RIVAL_BRANDS)),
    staffMembers: JSON.parse(JSON.stringify(INITIAL_STAFF)),
    keyTalents: JSON.parse(JSON.stringify(AVAILABLE_KEY_TALENTS)),
    activeHrEvents: [],
    activeTraining: null,
    activeCrises: [GAME_CRISES[0]], // Start with the Arthur Vance Drive crisis available!
    resolvedCrisisHistory: [],
    newsFeed: JSON.parse(JSON.stringify(INITIAL_NEWS_ARTICLES)),
    stockHistory: initialStockHistory,
    activeNegotiation: {
      character: null,
      messages: [],
    },
    isGameOver: false,
    ending: null,
    quarterHistory: [],
  };
}
