export type ProductCategory = 'chip' | 'smartphone' | 'console' | 'tablet' | 'smartwatch';
export type TargetSegment = 'budget' | 'mid' | 'premium' | 'ultra';

export interface ProductSpecs {
  performance: number; // 10 - 100
  efficiency: number;  // 10 - 100
  design: number;      // 10 - 100
  software: number;    // 10 - 100
}

export interface ProductLaunchInput {
  name: string;
  category: ProductCategory;
  segment: TargetSegment;
  specs: ProductSpecs;
  devDays: number;         // Prazo de desenvolvimento
  unitPrice: number;       // Preço unitário de venda
  marketingBudget: number; // Investimento em publicidade & hype
}

export interface CategoryBaselineConfig {
  name: string;
  tagline: string;
  baseRdCost: number;
  baseUnitProdCost: number;
  minDevDays: number;
  recommendedDevDays: number;
  maxRecommendedDevDays: number;
  weights: {
    performance: number;
    efficiency: number;
    design: number;
    software: number;
  };
  segmentPriceRange: Record<TargetSegment, { min: number; max: number; ideal: number }>;
  potentialMarketUnits: Record<TargetSegment, number>;
}

export const CATEGORY_BASELINE: Record<ProductCategory, CategoryBaselineConfig> = {
  chip: {
    name: 'Processadores & Chips de IA',
    tagline: 'Litografia de ponta e semicondutores neurais',
    baseRdCost: 140000,
    baseUnitProdCost: 55,
    minDevDays: 45,
    recommendedDevDays: 120,
    maxRecommendedDevDays: 240,
    weights: { performance: 0.45, efficiency: 0.35, design: 0.05, software: 0.15 },
    segmentPriceRange: {
      budget: { min: 90, max: 180, ideal: 140 },
      mid: { min: 200, max: 380, ideal: 290 },
      premium: { min: 450, max: 950, ideal: 680 },
      ultra: { min: 1100, max: 2600, ideal: 1750 },
    },
    potentialMarketUnits: { budget: 42000, mid: 24000, premium: 11000, ultra: 3800 },
  },
  smartphone: {
    name: 'Smartphones & Dispositivos Móveis',
    tagline: 'O coração do ecossistema pessoal do consumidor',
    baseRdCost: 95000,
    baseUnitProdCost: 130,
    minDevDays: 30,
    recommendedDevDays: 90,
    maxRecommendedDevDays: 180,
    weights: { performance: 0.25, efficiency: 0.25, design: 0.30, software: 0.20 },
    segmentPriceRange: {
      budget: { min: 199, max: 399, ideal: 299 },
      mid: { min: 450, max: 799, ideal: 599 },
      premium: { min: 899, max: 1399, ideal: 1099 },
      ultra: { min: 1499, max: 2499, ideal: 1899 },
    },
    potentialMarketUnits: { budget: 36000, mid: 21000, premium: 12500, ultra: 4200 },
  },
  console: {
    name: 'Consoles de Videogame & Entretenimento',
    tagline: 'Poder computacional dedicado a jogos e experiências interativas',
    baseRdCost: 160000,
    baseUnitProdCost: 220,
    minDevDays: 60,
    recommendedDevDays: 150,
    maxRecommendedDevDays: 300,
    weights: { performance: 0.40, efficiency: 0.15, design: 0.20, software: 0.25 },
    segmentPriceRange: {
      budget: { min: 199, max: 329, ideal: 269 },
      mid: { min: 360, max: 549, ideal: 449 },
      premium: { min: 599, max: 849, ideal: 699 },
      ultra: { min: 899, max: 1599, ideal: 1199 },
    },
    potentialMarketUnits: { budget: 22000, mid: 16000, premium: 9500, ultra: 3100 },
  },
  tablet: {
    name: 'Tablets & Telas Criativas',
    tagline: 'Estações de trabalho móveis para artistas e executivos',
    baseRdCost: 80000,
    baseUnitProdCost: 110,
    minDevDays: 30,
    recommendedDevDays: 75,
    maxRecommendedDevDays: 160,
    weights: { performance: 0.25, efficiency: 0.20, design: 0.35, software: 0.20 },
    segmentPriceRange: {
      budget: { min: 159, max: 319, ideal: 249 },
      mid: { min: 369, max: 629, ideal: 489 },
      premium: { min: 699, max: 1149, ideal: 899 },
      ultra: { min: 1249, max: 2099, ideal: 1599 },
    },
    potentialMarketUnits: { budget: 26000, mid: 15000, premium: 7500, ultra: 2400 },
  },
  smartwatch: {
    name: 'Smartwatches & Sensores Corporais',
    tagline: 'Wearables de monitoramento contínuo e status pessoal',
    baseRdCost: 65000,
    baseUnitProdCost: 70,
    minDevDays: 25,
    recommendedDevDays: 60,
    maxRecommendedDevDays: 140,
    weights: { performance: 0.15, efficiency: 0.40, design: 0.35, software: 0.10 },
    segmentPriceRange: {
      budget: { min: 89, max: 189, ideal: 139 },
      mid: { min: 219, max: 369, ideal: 279 },
      premium: { min: 429, max: 749, ideal: 549 },
      ultra: { min: 799, max: 1599, ideal: 1099 },
    },
    potentialMarketUnits: { budget: 32000, mid: 19000, premium: 9000, ultra: 2800 },
  },
};

/**
 * Calcula o custo de R&D com curva de retorno decrescente exponencial (80->90 é ~6x mais caro que 20->30).
 */
export function calculateRdCost(category: ProductCategory, specs: ProductSpecs): number {
  const config = CATEGORY_BASELINE[category];
  const specCurve = (v: number) => Math.pow(Math.max(10, Math.min(100, v)) / 100, 2.35);

  const totalWeightedSpecScale =
    specCurve(specs.performance) * config.weights.performance +
    specCurve(specs.efficiency) * config.weights.efficiency +
    specCurve(specs.design) * config.weights.design +
    specCurve(specs.software) * config.weights.software;

  // Custo base de pesquisa + multiplicador de complexidade de specs
  const rawCost = config.baseRdCost * (0.2 + totalWeightedSpecScale * 1.8);
  return Math.round(rawCost / 500) * 500;
}

/**
 * Avalia o risco probabilístico de defeito de fabricação ou recall catastrófico.
 */
export function calculateRecallRisk(category: ProductCategory, devDays: number, specs: ProductSpecs): number {
  const config = CATEGORY_BASELINE[category];
  const avgSpecs = (specs.performance + specs.efficiency + specs.design + specs.software) / 4;

  if (devDays >= config.recommendedDevDays) {
    // Prazo maduro: risco mínimo residual
    const buffer = (devDays - config.recommendedDevDays) / config.recommendedDevDays;
    return Math.max(1, Math.round(4 - buffer * 2));
  }

  // Prazo apertado (rushed)
  const rushFactor = (config.recommendedDevDays - devDays) / config.recommendedDevDays;
  const specComplexityFactor = avgSpecs > 75 ? (avgSpecs - 75) * 0.4 : 0;
  const categoryHazard = category === 'chip' ? 12 : category === 'smartwatch' ? 10 : 6;

  const calculatedRisk = rushFactor * 55 + specComplexityFactor + categoryHazard;
  return Math.min(85, Math.max(3, Math.round(calculatedRisk)));
}

export interface ProductLaunchResult {
  id: string;
  name: string;
  category: ProductCategory;
  segment: TargetSegment;
  reviewScore: number;
  reviewVerdict: string;
  criticsFeedback: string[];
  unidadesVendidas: number;
  receitaTotal: number;
  custoTotal: number;
  rdCost: number;
  marketingCost: number;
  producaoCost: number;
  recallCost: number;
  lucro: number;
  hype: number;
  qualidadeReal: number;
  recallRisk: number;
  teveRecall: boolean;
  recallReason?: string;
  reputacaoDelta: {
    public: number;
    investors: number;
    customers: number;
    employees: number;
  };
  eventoDeMercado: {
    tipo: string;
    detalhes: string;
    impactoAcoes: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  };
}

/**
 * Função principal de lançamento de produto
 */
export function launchProduct(
  input: ProductLaunchInput,
  competidores: any[] = [],
  reputacao: { public: number; investors: number; customers: number; employees: number } = {
    public: 50,
    investors: 50,
    customers: 50,
    employees: 50,
  }
): ProductLaunchResult {
  const config = CATEGORY_BASELINE[input.category];
  const { specs, devDays, unitPrice, marketingBudget, segment } = input;

  // 1. R&D com retorno decrescente
  const rdCost = calculateRdCost(input.category, specs);

  // 2. Qualidade Real ponderada por categoria
  const qualidadeReal = Math.round(
    specs.performance * config.weights.performance +
    specs.efficiency * config.weights.efficiency +
    specs.design * config.weights.design +
    specs.software * config.weights.software
  );

  // 3. Risco de Defeito / Recall
  const recallRisk = calculateRecallRisk(input.category, devDays, specs);
  // Roll de chance de recall
  const roll = Math.random() * 100;
  const teveRecall = roll < recallRisk;

  let recallReason: string | undefined = undefined;
  if (teveRecall) {
    const reasons: Record<ProductCategory, string[]> = {
      chip: [
        'Superaquecimento crítico de solda e fusão de núcleos em carga máxima.',
        'Falha grave de microcódigo causando tela azul em 23% dos lotes.',
        'Degradação acelerada de voltagem na litografia sub-3nm.',
      ],
      smartphone: [
        'Células de bateria inchando e risco de ignição espontânea no carregamento rápido.',
        'Vidro traseiro descolando e perda total de certificação à prova d’água.',
        'Antena integrada com perda abrupta de sinal ao segurar o aparelho na mão esquerda.',
      ],
      console: [
        'Anel vermelho da morte: dissipador térmico entupido em 40 horas de jogo.',
        'Mecanismo de resfriamento líquido vazando sobre os conectores da placa-mãe.',
        'Firmware de lançamento bloqueando permanentemente unidades após update de dia 1.',
      ],
      tablet: [
        'Carcaça entortando com pressão moderada na mochila dos usuários.',
        'Linhas verdes permanentes e flickering epilético na tela OLED após 10 dias de uso.',
        'Controlador de caneta stylus parando de responder e superaquecendo o painel.',
      ],
      smartwatch: [
        'Sensor de frequência cardíaca causando queimaduras de primeiro grau por superaquecimento.',
        'Vedação de água rompendo em piscina rasa mesmo com promessa de mergulho até 50m.',
        'Bateria descarregando de 100% para zero em menos de 105 minutos.',
      ],
    };
    const options = reasons[input.category] || ['Falha mecânica generalizada na linha de montagem inicial.'];
    recallReason = options[Math.floor(Math.random() * options.length)];
  }

  // 4. Hype separado da qualidade
  const marketingFactor = Math.min(100, Math.round(Math.sqrt(marketingBudget / 500) * 11));
  const brandPublicBonus = (reputacao.public - 50) * 0.3;
  const hype = Math.min(100, Math.max(10, Math.round(marketingFactor + brandPublicBonus + (segment === 'ultra' ? 12 : 5))));

  // 5. Verificação de Preço e Segmento
  const priceTarget = config.segmentPriceRange[segment];
  let priceScoreModifier = 1.0;
  let priceReviewPenalty = 0;

  if (unitPrice > priceTarget.max) {
    // Sobrepreço abusivo
    const overageRatio = (unitPrice - priceTarget.max) / priceTarget.max;
    priceScoreModifier = Math.max(0.2, 1.0 - overageRatio * 1.3);
    priceReviewPenalty = Math.min(30, Math.round(overageRatio * 35));
  } else if (unitPrice < priceTarget.min) {
    // Preço excessivamente baixo (margem esmagada e suspeita de baixa qualidade)
    const underRatio = (priceTarget.min - unitPrice) / priceTarget.min;
    priceScoreModifier = Math.min(1.25, 1.0 + underRatio * 0.4);
    priceReviewPenalty = Math.min(10, Math.round(underRatio * 12));
  } else {
    // Preço no ponto doce
    priceScoreModifier = 1.05;
  }

  // 6. Nota da Crítica (Reviews)
  let rawReviewScore = qualidadeReal;
  if (teveRecall) {
    rawReviewScore = Math.max(15, rawReviewScore - 42); // Recall massacra a nota
  }
  rawReviewScore -= priceReviewPenalty;

  // Bônus de software polido
  if (specs.software >= 85) rawReviewScore += 4;
  // Bônus de design arrojado
  if (specs.design >= 90) rawReviewScore += 3;

  const reviewScore = Math.min(99, Math.max(12, Math.round(rawReviewScore)));

  // Crítica e Verdict
  let reviewVerdict = 'Sólido & Competitivo';
  const criticsFeedback: string[] = [];

  if (teveRecall) {
    reviewVerdict = 'Fiasco & Recall Global';
    criticsFeedback.push(`"Desastre de engenharia: ${recallReason}" — TechRadar`);
    criticsFeedback.push(`"A ganância de apressar o cronograma cobrou seu preço em chamas." — The Verge`);
  } else if (reviewScore >= 90) {
    reviewVerdict = 'Obra-Prima Inovadora';
    criticsFeedback.push(`"Uma obra-prima incontestável que coloca os rivais em pânico absoluto." — Silicon Disruption`);
    criticsFeedback.push(`"O melhor produto da categoria já desenhado pela Vantex." — Wired`);
  } else if (reviewScore >= 78) {
    reviewVerdict = 'Recomendação de Ouro';
    criticsFeedback.push(`"Equilíbrio notável de especificações e entrega de ponta a ponta." — Engadget`);
    criticsFeedback.push(`"Vale cada centavo cobrado. Execução muito refinada." — GizmoLeak`);
  } else if (reviewScore >= 60) {
    reviewVerdict = 'Aceitável com Ressalvas';
    criticsFeedback.push(`"Cumpre o que promete, mas sem qualquer lampejo de genialidade." — TechPulse News`);
    criticsFeedback.push(`"O hardware é honesto, mas a concorrência oferece mais brilho." — AnandTech`);
  } else {
    reviewVerdict = 'Decepção Mercadológica';
    criticsFeedback.push(`"Uma oportunidade desperdiçada embrulhada em promessas vazias de marketing." — Bloomberg Tech`);
    criticsFeedback.push(`"Cortaram custos nos lugares errados. Produto frágil e sem alma." — Wall Street Tech`);
  }

  // 7. Cálculo de Vendas (Volume)
  const basePotentialUnits = config.potentialMarketUnits[segment];
  const hypePull = (hype / 100) * 0.50; // Hype puxa as pré-vendas e primeiro mês
  const qualitySustain = Math.pow(reviewScore / 100, 1.8) * 0.65; // Crítica sustenta boca a boca

  let totalDemandFactor = (hypePull + qualitySustain) * priceScoreModifier;

  // Efeito de reputação corporativa geral
  const customerRepFactor = 1 + (reputacao.customers - 50) / 120;
  totalDemandFactor *= customerRepFactor;

  let unidadesVendidas = Math.round(basePotentialUnits * totalDemandFactor);
  if (teveRecall) {
    // 35% de cancelamento imediato de pedidos
    unidadesVendidas = Math.round(unidadesVendidas * 0.65);
  }

  // 8. Custos de Produção e Logística
  const unitProdCost = Math.round(config.baseUnitProdCost * (0.6 + (qualidadeReal / 100) * 0.8));
  const producaoCost = Math.round(unidadesVendidas * unitProdCost);
  const receitaBruta = Math.round(unidadesVendidas * unitPrice);

  let recallCost = 0;
  if (teveRecall) {
    // Custos de troca, reembolso de 45% das unidades vendidas e frete emergencial reverso
    const refundedUnits = Math.round(unidadesVendidas * 0.45);
    recallCost = Math.round(refundedUnits * unitPrice + unidadesVendidas * 45 + 150000);
  }

  const custoTotal = rdCost + marketingBudget + producaoCost + recallCost;
  const lucro = Math.round(receitaBruta - custoTotal);

  // 9. Reputação Delta
  let reputacaoDelta = {
    public: 0,
    investors: 0,
    customers: 0,
    employees: 0,
  };

  if (teveRecall) {
    reputacaoDelta = {
      public: -24,
      investors: -20,
      customers: -32,
      employees: -12,
    };
  } else if (reviewScore >= 90) {
    reputacaoDelta = {
      public: +14,
      investors: +16,
      customers: +18,
      employees: +10,
    };
  } else if (reviewScore >= 78) {
    reputacaoDelta = {
      public: +8,
      investors: +10,
      customers: +10,
      employees: +6,
    };
  } else if (hype > 75 && reviewScore < 60) {
    // Hipócrita / Overhyped (decepção do consumidor)
    reputacaoDelta = {
      public: -12,
      investors: -8,
      customers: -18,
      employees: -4,
    };
  } else if (reviewScore < 50) {
    reputacaoDelta = {
      public: -6,
      investors: -5,
      customers: -8,
      employees: -3,
    };
  } else {
    reputacaoDelta = {
      public: +2,
      investors: +3,
      customers: +3,
      employees: +1,
    };
  }

  // 10. Evento de Mercado para notícias
  let stockImpact = 0;
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';

  if (teveRecall) {
    stockImpact = -(14 + Math.round(Math.random() * 8));
    sentiment = 'bearish';
  } else if (lucro > 2000000 && reviewScore >= 85) {
    stockImpact = +(12 + Math.round(Math.random() * 8));
    sentiment = 'bullish';
  } else if (lucro > 500000 && reviewScore >= 75) {
    stockImpact = +(6 + Math.round(Math.random() * 5));
    sentiment = 'bullish';
  } else if (lucro < -300000 || reviewScore < 50) {
    stockImpact = -(5 + Math.round(Math.random() * 6));
    sentiment = 'bearish';
  } else {
    stockImpact = +(1 + Math.round(Math.random() * 3));
    sentiment = 'neutral';
  }

  const eventoDeMercado = {
    tipo: `Lançamento de Produto: ${input.name}`,
    detalhes: teveRecall
      ? `Fiasco com recall declarado da linha ${input.name} (${config.name}). Nota ${reviewScore}/100. Prejuízo de $${Math.abs(lucro).toLocaleString()}. Motivo: ${recallReason}`
      : `Lançamento oficial de ${input.name} (${config.name}). Nota da crítica: ${reviewScore}/100 (${reviewVerdict}). ${unidadesVendidas.toLocaleString()} unidades vendidas gerando lucro líquido de $${lucro.toLocaleString()}.`,
    impactoAcoes: stockImpact,
    sentiment,
  };

  return {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: input.name,
    category: input.category,
    segment: input.segment,
    reviewScore,
    reviewVerdict,
    criticsFeedback,
    unidadesVendidas,
    receitaTotal: receitaBruta,
    custoTotal,
    rdCost,
    marketingCost: marketingBudget,
    producaoCost,
    recallCost,
    lucro,
    hype,
    qualidadeReal,
    recallRisk,
    teveRecall,
    recallReason,
    reputacaoDelta,
    eventoDeMercado,
  };
}
