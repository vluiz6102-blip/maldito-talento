import { GameState, GameEra, CrisisEvent, NewsArticle } from '../types';
import { GAME_CRISES } from '../data/crises';
import { RANDOM_MARKET_EVENTS } from '../data/marketEvents';
import { HR_EVENTS_POOL } from '../data/talents';
import { RIVAL_PERIODIC_NEWS, generateDynamicNewsArticle } from '../data/news';
import { sounds } from './audio';

export interface AdvanceResult {
  nextState: GameState;
  eventsTriggered: string[];
  quarterEnded: boolean;
  bankruptcyTriggered: boolean;
  eraPromoted: GameEra | null;
}

export function advanceSimulationDays(prevState: GameState, daysToAdvance: number): AdvanceResult {
  const next: GameState = JSON.parse(JSON.stringify(prevState));
  const eventsTriggered: string[] = [];
  let quarterEnded = false;
  let bankruptcyTriggered = false;
  let eraPromoted: GameEra | null = null;

  // Track active perks from hired key talents
  const hiredKeyTalents = (next.keyTalents || []).filter(k => k.isHired);
  const hasViktorDebtPerk = hiredKeyTalents.some(k => k.uniquePerk.effectKey === 'debt_interest_discount');
  const hasMayaRdPerk = hiredKeyTalents.some(k => k.uniquePerk.effectKey === 'rd_breakthrough_boost');
  const hasSophiaMktPerk = hiredKeyTalents.some(k => k.uniquePerk.effectKey === 'customer_trust_multiplier');
  const hasKaiProdPerk = hiredKeyTalents.some(k => k.uniquePerk.effectKey === 'product_quality_multiplier');

  // Ensure arrays exist
  if (!next.staffMembers) next.staffMembers = [];
  if (!next.activeHrEvents) next.activeHrEvents = [];
  if (!next.newsFeed) next.newsFeed = [];

  for (let d = 0; d < daysToAdvance; d++) {
    next.day += 1;

    // Advance Active HR Training Program
    if (next.activeTraining) {
      next.activeTraining.daysRemaining -= 1;
      if (next.activeTraining.daysRemaining <= 0) {
        const { programName, targetSpecialty, skillGain, moraleGain } = next.activeTraining;
        // Apply training gains to participating staff
        next.staffMembers.forEach(s => {
          if (!targetSpecialty || targetSpecialty === 'all' || s.specialty === targetSpecialty) {
            s.skillLevel = Math.min(10, s.skillLevel + (skillGain || 2));
            s.morale = Math.min(100, s.morale + (moraleGain || 15));
          }
        });
        next.reputation.employees = Math.min(100, next.reputation.employees + 8);
        eventsTriggered.push(`🎓 TREINAMENTO CONCLUÍDO: "${programName}". Habilidades e moral dos colaboradores aumentaram!`);
        sounds.playSuccessChime();
        next.activeTraining = null;
      }
    }

    // Debt deadline countdown
    if (next.debt > 0) {
      next.debtDeadlineDays -= 1;
      if (next.debtDeadlineDays <= 0) {
        bankruptcyTriggered = true;
        next.isGameOver = true;
        next.ending = 'liquidation_collapse';
        eventsTriggered.push('O prazo de 90 dias do Confiança Federal expirou! A empresa foi liquidada judicialmente.');
        sounds.playWarningBeep();
        break;
      }
    }

    // Daily Staff Payroll from hired regular staff & key talents
    const regularPayroll = next.staffMembers.reduce((acc, s) => acc + s.salary, 0);
    const keyTalentPayroll = hiredKeyTalents.reduce((acc, k) => acc + k.salary, 0);
    const totalQuarterPayroll = regularPayroll + keyTalentPayroll;

    // Reputation multiplier: Customer Trust affects sales revenue (+/- 30%)
    const customerTrustMult = 1 + (next.reputation.public - 50) * 0.006;
    // Reputation multiplier: Employee Morale affects productivity & departments (+/- 25%)
    const employeeMoraleMult = 1 + (next.reputation.employees - 50) * 0.005;

    // Daily cashflow: daily revenue minus daily expenses
    const baseDailyRev = (next.quarterlyRevenue * customerTrustMult) / 90;
    const mayaBonusDaily = hasMayaRdPerk ? (25000 / 90) : 0;
    const dailyRev = baseDailyRev + mayaBonusDaily;

    const baseDeptExpenses =
      next.departments.product.budget +
      next.departments.marketing.budget +
      next.departments.hr.budget +
      next.departments.legal.budget +
      next.departments.rd.budget +
      totalQuarterPayroll;

    // Viktor Sterling perk: 15% discount on operational expenses
    const expenseDiscount = hasViktorDebtPerk ? 0.85 : 1.0;
    next.quarterlyExpenses = Math.round(baseDeptExpenses * expenseDiscount);
    const dailyExp = next.quarterlyExpenses / 90;
    const dailyNet = dailyRev - dailyExp;

    next.cash += dailyNet;

    // Daily stock fluctuation based on Investor Relations and market momentum
    const investorFactor = (next.reputation.investors - 50) / 1000; // -0.05 to +0.05
    const customerFactor = (next.reputation.public - 50) / 2000;
    const noise = (Math.random() - 0.49) * 0.035;
    const pctChange = investorFactor + customerFactor + noise;
    next.stockPrice = Math.max(0.20, Number((next.stockPrice * (1 + pctChange)).toFixed(2)));

    // Monthly Random Market Event (every 30 days)
    if (next.day % 30 === 0 && !next.isGameOver && next.activeCrises.length === 0) {
      const eventChance = Math.random();
      // Calculate total probability space or just pick one if chance hits
      let cumulative = 0;
      let selectedEvent = null;
      for (const ev of RANDOM_MARKET_EVENTS) {
        cumulative += ev.baseProbability;
        if (eventChance <= cumulative) {
          selectedEvent = ev;
          break;
        }
      }

      if (selectedEvent) {
        const newEvent = {
          ...selectedEvent,
          id: `market_event_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          era: next.era,
        };
        next.activeCrises.push(newEvent);
        eventsTriggered.push(`📊 EVENTO DE MERCADO: "${newEvent.title}". Decisão executiva pendente na aba de Crises.`);
        sounds.playWarningBeep();
      }
    }

    // Quarter tick every 90 days
    if (next.day % 90 === 0) {
      quarterEnded = true;
      next.quarter += 1;

      // Calculate Board Confidence update before resetting quarter metrics
      const netQuarterProfit = next.quarterlyRevenue - next.quarterlyExpenses;
      const { atualizarConfiancaConselho, BOARD_NO_CONFIDENCE_EVENT } = require('./boardSystem');
      
      const repMedia = (next.reputation.public + next.reputation.investors + next.reputation.employees + next.reputation.esg) / 4;
      
      // Check for unethical actions recorded this quarter (proxy check)
      const acoesAntiEticas = next.resolvedCrisisHistory
        .filter(r => r.day > next.day - 90 && ['vance_blackmail_winsoft', 'vance_destroy_drive', 'market_hack_hide', 'market_strike_fight'].includes(r.choiceId))
        .length;

      next.conselho = atualizarConfiancaConselho(next.conselho, {
        lucro: netQuarterProfit,
        produtosLancados: 0, // Simplified for now
        reputacaoMedia: repMedia,
        acoesAntiEticas
      });

      // Board No Confidence Vote Trigger Check
      if (next.conselho.trimestresConsecutivosCriticos >= 2 && next.conselho.ultimaVotacao !== `Q${next.quarter-1}`) {
        // Did they already survive a vote recently? If they survived but failed AGAIN, game over.
        const hasSurvivedVote = next.resolvedCrisisHistory.some(r => r.choiceId.startsWith('board_vote_'));
        
        if (hasSurvivedVote && next.conselho.trimestresConsecutivosCriticos >= 3) {
          next.isGameOver = true;
          next.ending = 'fired_by_board';
          eventsTriggered.push('❌ DESTITUÍDO! O Conselho de Administração perdeu completamente a paciência e votou pela sua remoção imediata.');
          sounds.playWarningBeep();
        } else {
          // Trigger the crisis
          const voteCrisis = {
            ...BOARD_NO_CONFIDENCE_EVENT,
            id: `board_vote_${next.day}`,
            era: next.era
          };
          next.activeCrises.push(voteCrisis);
          next.conselho.ultimaVotacao = `Q${next.quarter-1}`;
          eventsTriggered.push(`⚠️ ALERTA VERMELHO: A Confiança do Conselho caiu para ${next.conselho.confianca}%. Voto de desconfiança instaurado!`);
          sounds.playWarningBeep();
        }
      }

      // Interest on remaining bank debt (3.5% per quarter, reduced by 50% if Viktor Sterling is hired)
      if (next.debt > 0) {
        const interestRate = hasViktorDebtPerk ? 0.0175 : 0.035;
        const interest = Math.round(next.debt * interestRate);
        next.debt += interest;
        eventsTriggered.push(
          `Juros trimestrais de $${interest.toLocaleString()} adicionados à dívida do Confiança Federal${hasViktorDebtPerk ? ' (com 50% de desconto por Viktor Sterling)' : ''}.`
        );
      }

      // Record quarter history
      next.quarterHistory.push({
        quarter: next.quarter - 1,
        revenue: Math.round(next.quarterlyRevenue),
        expenses: Math.round(next.quarterlyExpenses),
        netProfit: Math.round(netQuarterProfit),
        endingCash: Math.round(next.cash),
        stockPrice: next.stockPrice,
      });

      // Recalculate quarterly revenue with department effectiveness modulated by staff and employee morale
      const prodMult = 1 + (next.departments.product.effectiveness * employeeMoraleMult - 50) / 100;
      const mktBonus = hasSophiaMktPerk ? 1.4 : 1.0;
      const mktMult = (1 + (next.departments.marketing.effectiveness * employeeMoraleMult - 50) / 100) * mktBonus;
      next.quarterlyRevenue = Math.round(next.quarterlyRevenue * (0.95 + 0.1 * prodMult * mktMult));

      // Era advancement checks
      if (next.era === 'garage' && (next.debt <= 0 || next.cash > 250000)) {
        next.era = 'scaleup';
        eraPromoted = 'scaleup';
        eventsTriggered.push('🎉 EVOLUÇÃO DE ERA! A Vantex Dynamics sobreviveu à garagem e agora é uma Scale-up nacional!');
        sounds.playSuccessChime();
        next.newsFeed.unshift({
          id: `news_era_${next.day}`,
          day: next.day,
          quarter: next.quarter,
          source: 'TechPulse News',
          author: 'Renan Vasques',
          category: 'vantex',
          title: 'Vantex Dynamics renasce das cinzas e entra em rodada de expansão nacional',
          snippet: 'Após estancar a crise deixada por Arthur Vance, a startup anuncia salto em faturamento e novas contratações.',
          fullContent: 'Contra todas as probabilidades de Wall Street, a Vantex Dynamics superou a fase de garagem. Com contas reestruturadas e novos talentos contratados, a companhia entra agora no disputado mercado de scale-ups de tecnologia.',
          sentiment: 'bullish',
          marketImpact: '$VNTX salta +22% com celebração de investidores',
        });
      } else if (next.era === 'scaleup' && next.quarterlyRevenue > 400000 && next.cash > 500000) {
        next.era = 'national';
        eraPromoted = 'national';
        eventsTriggered.push('🏢 EVOLUÇÃO DE ERA! A Vantex Dynamics tornou-se uma Corporação Nacional de destaque!');
        sounds.playSuccessChime();
      } else if (next.era === 'national' && next.quarterlyRevenue > 1500000 && next.stockPrice > 25.0) {
        next.era = 'global';
        eraPromoted = 'global';
        eventsTriggered.push('🌐 EVOLUÇÃO DE ERA! A Vantex agora disputa com Amazora e Alphagoo no mercado global!');
        sounds.playSuccessChime();
      } else if (next.era === 'global' && (next.stockPrice > 80.0 || next.cash > 10000000)) {
        next.era = 'empire';
        eraPromoted = 'empire';
        eventsTriggered.push('👑 EVOLUÇÃO FINAL: IMPÉRIO CORPORATIVO! O mercado reverencia o novo conglomerado Vantex!');
        sounds.playSuccessChime();
      }
    }
  }

  // Update stock history graph points
  if (next.stockHistory.length === 0 || next.day - next.stockHistory[next.stockHistory.length - 1].day >= 7) {
    next.stockHistory.push({
      day: next.day,
      price: next.stockPrice,
    });
    if (next.stockHistory.length > 30) {
      next.stockHistory.shift();
    }
  }

  // Periodic random competitor news trigger (Amazora, Metaphase, Orange Inc, WinSoft)
  if (Math.random() < 0.35 && next.day > 5) {
    const randomRivalNews = RIVAL_PERIODIC_NEWS[Math.floor(Math.random() * RIVAL_PERIODIC_NEWS.length)];
    const alreadyPresent = next.newsFeed.some(n => n.title === randomRivalNews.title);
    if (!alreadyPresent) {
      next.newsFeed.unshift({
        ...randomRivalNews,
        id: `rival_news_${next.day}_${Math.random()}`,
        day: next.day,
        quarter: next.quarter,
      });
    }
  }

  // Check for HR Events (Greve se moral baixa, ou assédio de talentos da Amazora)
  if (next.activeHrEvents.length === 0 && !next.isGameOver) {
    if (next.reputation.employees < 38) {
      // Strike event triggered by low employee morale
      const strikeEvent = HR_EVENTS_POOL.find(h => h.type === 'strike');
      if (strikeEvent) {
        next.activeHrEvents.push(strikeEvent);
        eventsTriggered.push('🚨 ALERTA DE RH: Moral dos colaboradores despencou! O sindicato ameaça greve geral!');
        sounds.playWarningBeep();
      }
    } else if (next.day >= 25 && Math.random() < 0.28) {
      // Random poaching or salary demand event
      const candidates = HR_EVENTS_POOL.filter(h => h.type !== 'strike');
      const randomEvent = candidates[Math.floor(Math.random() * candidates.length)];
      if (randomEvent) {
        next.activeHrEvents.push(randomEvent);
        eventsTriggered.push(`📋 DILEMA DE RECURSOS HUMANOS: "${randomEvent.title}". Decisão executiva pendente na aba de RH.`);
      }
    }
  }

  // Check for new crisis trigger if no active crises
  if (next.activeCrises.length === 0 && !next.isGameOver) {
    const resolvedIds = new Set(next.resolvedCrisisHistory.map(r => r.crisisId));
    const availableCrisis = GAME_CRISES.find(c => {
      if (resolvedIds.has(c.id)) return false;
      if (c.era === next.era) return true;
      if (next.era === 'scaleup' && c.era === 'garage') return false;
      return false;
    });

    if (availableCrisis && Math.random() < 0.65) {
      next.activeCrises.push(availableCrisis);
      eventsTriggered.push(`⚠️ NOVA CRISE EXECUTIVA: "${availableCrisis.title}". Convocação extraordinária do Conselho!`);
      sounds.playWarningBeep();
    }
  }

  // Check for victory endings if in Empire era or exceptional milestones
  if (!next.isGameOver) {
    if (next.era === 'empire') {
      if (next.reputation.esg >= 75 && next.reputation.employees >= 70 && next.traits.ethical >= 65) {
        next.isGameOver = true;
        next.ending = 'ethical_visionary';
        eventsTriggered.push('🌟 FIM DE JOGO: Final Visionário Ético alcançado!');
        sounds.playSuccessChime();
      } else if (next.traits.ruthless >= 70 && (next.cash > 20000000 || next.stockPrice > 120)) {
        next.isGameOver = true;
        next.ending = 'wall_street_shark';
        eventsTriggered.push('🦈 FIM DE JOGO: Final Tubarão de Wall Street alcançado!');
        sounds.playSuccessChime();
      }
    } else if (next.day >= 85 && next.debtDeadlineDays <= 5 && next.debt <= 0 && next.cash > 50000) {
      // Phoenix turnaround
      if (!next.resolvedCrisisHistory.some(r => r.crisisId === 'phoenix_marker')) {
        next.resolvedCrisisHistory.push({ crisisId: 'phoenix_marker', choiceId: 'phoenix', day: next.day });
        eventsTriggered.push('🔥 MANOBRA FÊNIX: Você quitou a dívida bancária nos últimos dias de vida da empresa!');
      }
    }
  }

  return {
    nextState: next,
    eventsTriggered,
    quarterEnded,
    bankruptcyTriggered,
    eraPromoted,
  };
}

export function makeDebtPayment(prevState: GameState, amount: number): { success: boolean; nextState: GameState; message: string } {
  if (prevState.cash < amount) {
    return { success: false, nextState: prevState, message: 'Saldo em caixa insuficiente para amortização!' };
  }
  if (prevState.debt <= 0) {
    return { success: false, nextState: prevState, message: 'A empresa não possui dívidas ativas pendentes!' };
  }

  const next = JSON.parse(JSON.stringify(prevState));
  const payActual = Math.min(amount, next.debt);
  next.cash -= payActual;
  next.debt -= payActual;

  next.reputation.investors = Math.min(100, next.reputation.investors + Math.round(payActual / 40000));
  next.stockPrice = Number((next.stockPrice * (1 + payActual / 1000000)).toFixed(2));

  sounds.playCashChime();

  let message = `Amortização de $${payActual.toLocaleString()} realizada com sucesso junto ao Confiança Federal.`;

  if (next.debt <= 0) {
    next.debt = 0;
    message += ' 🎉 DÍVIDA TOTALMENTE QUITADA! A Vantex está livre de execuções judiciais!';
    next.reputation.investors = Math.min(100, next.reputation.investors + 20);
    sounds.playSuccessChime();
    next.newsFeed.unshift({
      id: `news_debt_clear_${next.day}`,
      day: next.day,
      quarter: next.quarter,
      source: 'Wall Street Dispatch',
      title: 'HISTÓRICO: Vantex Dynamics quita 100% da dívida e encerra processo de execução',
      snippet: 'Dr. Osvaldo Barreto assina quitação integral. Ações sobem 18% no pré-mercado.',
      sentiment: 'bullish',
    });
  }

  return { success: true, nextState: next, message };
}
