import { ConselhoState, GameState, CrisisEvent } from '../types';

export interface ResultadoTrimestre {
  lucro: number;
  produtosLancados: number; // For innovation
  reputacaoMedia: number;
  acoesAntiEticas: number; // Proxy for ethical tracking
}

export function atualizarConfiancaConselho(estadoAtual: ConselhoState, resultado: ResultadoTrimestre): ConselhoState {
  const nextConselho = JSON.parse(JSON.stringify(estadoAtual)) as ConselhoState;

  let somaSatisfacao = 0;

  nextConselho.membros.forEach(membro => {
    let delta = 0;

    switch (membro.prioridade) {
      case 'lucro':
        if (resultado.lucro > 200000) delta = 15;
        else if (resultado.lucro > 0) delta = 5;
        else if (resultado.lucro < -100000) delta = -15;
        else delta = -5;
        break;
      case 'reputacao':
        if (resultado.reputacaoMedia >= 70) delta = 10;
        else if (resultado.reputacaoMedia >= 50) delta = 5;
        else if (resultado.reputacaoMedia < 30) delta = -15;
        else delta = -5;
        break;
      case 'inovacao':
        if (resultado.produtosLancados > 0) delta = 15;
        else delta = -5;
        break;
      case 'etica':
        if (resultado.acoesAntiEticas > 0) delta = -20 * resultado.acoesAntiEticas;
        else delta = 5;
        break;
    }

    membro.satisfacaoIndividual = Math.max(0, Math.min(100, membro.satisfacaoIndividual + delta));
    somaSatisfacao += membro.satisfacaoIndividual;
  });

  nextConselho.confianca = Math.round(somaSatisfacao / nextConselho.membros.length);

  if (nextConselho.confianca < 35) {
    nextConselho.trimestresConsecutivosCriticos += 1;
  } else {
    nextConselho.trimestresConsecutivosCriticos = 0;
  }

  return nextConselho;
}

export const BOARD_NO_CONFIDENCE_EVENT: Omit<CrisisEvent, 'id'> = {
  title: 'Voto de Desconfiança do Conselho',
  era: 'garage', // Wil be overridden dynamically
  urgency: 'critical',
  sourceDept: 'board',
  description: 'O Conselho de Administração está farto dos resultados recentes e convocou uma votação emergencial. A menos que você apresente um plano de resgate excepcional, você será destituído do cargo de CEO.',
  flavorQuote: '"A paciência dos acionistas não é uma instituição de caridade." — Elias Barreto',
  choices: [
    {
      id: 'board_vote_bribe',
      label: 'Comprar lealdade (Dividendo Extraordinário)',
      description: 'Pagar um dividendo de emergência para acalmar o conselho.',
      traitBadge: 'Tubarão Implacável',
      requirements: { minCash: 250000 },
      outcomes: {
        cashDelta: -250000,
        debtDelta: 0,
        debtDaysDelta: 0,
        reputationDeltas: { investors: 15, employees: -10 },
        traitDeltas: { ruthless: 20 },
        stockPriceDelta: 0.50,
        headline: 'Vantex aprova dividendo surpresa e acalma conselho rebelde',
        narrativeResolution: 'O dinheiro falou mais alto. Você sobrevive para liderar mais um trimestre, mas o caixa sofreu.'
      }
    },
    {
      id: 'board_vote_promise',
      label: 'Apresentar plano de recuperação milagroso',
      description: 'Prometer um trimestre de lucros absurdos. Custa reputação e moral se falhar novamente.',
      traitBadge: 'Ousado',
      outcomes: {
        cashDelta: 0,
        debtDelta: 0,
        debtDaysDelta: 0,
        reputationDeltas: { public: -5, investors: 5, employees: -15 },
        traitDeltas: { bold: 20 },
        stockPriceDelta: -0.10,
        headline: 'CEO da Vantex sobrevive a votação de destituição com promessas ousadas',
        narrativeResolution: 'Eles deram mais uma chance, mas a corda está no pescoço.'
      }
    }
  ]
};
