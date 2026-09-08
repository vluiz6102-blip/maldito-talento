import { CrisisEvent } from '../types';

// Eventos Aleatórios de Mercado que podem acontecer a qualquer momento (era: 'any')
// Esses eventos usam a mesma estrutura de Crises, aparecendo na aba de Decisões.
export const RANDOM_MARKET_EVENTS: (Omit<CrisisEvent, 'id' | 'era'> & { baseProbability: number })[] = [
  {
    title: 'Crise Cambial Global',
    urgency: 'critical',
    sourceDept: 'board',
    baseProbability: 0.05,
    description: 'Um choque na taxa de juros internacional disparou o dólar. Nossos custos de importação de componentes eletrônicos subiram drasticamente da noite para o dia.',
    flavorQuote: '"O mercado não perdoa alavancagem em moeda estrangeira." — Analista da RockRidge',
    choices: [
      {
        id: 'market_fx_absorb',
        label: 'Absorver o prejuízo para manter preços',
        description: 'Mantém a confiança do consumidor, mas queima caixa vital.',
        traitBadge: 'Foco no Cliente',
        outcomes: {
          cashDelta: -120000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: 10, investors: -5 },
          traitDeltas: { ethical: 5 },
          stockPriceDelta: -0.80,
          headline: 'Vantex Dynamics segura preços na crise e ganha lealdade do consumidor',
          narrativeResolution: 'Nossas margens sofreram, mas as vendas continuam fortes.'
        }
      },
      {
        id: 'market_fx_pass',
        label: 'Repassar o custo aos produtos (+15%)',
        description: 'Protege o caixa, mas enfurece o público e prejudica o Hype atual.',
        traitBadge: 'Foco em Margem',
        outcomes: {
          cashDelta: 40000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: -15, investors: 5 },
          traitDeltas: { ruthless: 10 },
          stockPriceDelta: 0.50,
          headline: 'Vantex repassa custos cambiais e consumidores reclamam de preços inflados',
          narrativeResolution: 'As vendas despencaram levemente, mas a margem de lucro por unidade foi salva.'
        }
      }
    ]
  },
  {
    title: 'Vazamento de Dados de Clientes',
    urgency: 'critical',
    sourceDept: 'legal',
    baseProbability: 0.04,
    description: 'Hackers invadiram um servidor legado da gestão de Arthur Vance. Embora nenhum cartão de crédito tenha sido roubado, milhares de e-mails vazaram na dark web.',
    flavorQuote: '"Sua segurança cibernética é apenas tão forte quanto a senha do estagiário." — CTO',
    choices: [
      {
        id: 'market_hack_pay',
        label: 'Pagar a consultoria de contenção e compensar clientes',
        description: 'Custo imediato alto, mas previne processos futuros.',
        traitBadge: 'Gestão de Crise',
        outcomes: {
          cashDelta: -80000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: 5, esg: 10 },
          traitDeltas: { ethical: 10 },
          stockPriceDelta: -0.20,
          headline: 'Vantex age rápido em vazamento e ressarce base de usuários',
          narrativeResolution: 'A crise foi contida rapidamente antes de afetar vendas maiores.'
        }
      },
      {
        id: 'market_hack_hide',
        label: 'Abafar o caso e culpar fornecedor terceiro',
        description: 'Sem custo imediato, mas com risco legal absurdo se descobertos.',
        traitBadge: 'Arriscado',
        outcomes: {
          cashDelta: 0,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: -20, legal: -15 } as any, // fallback
          traitDeltas: { secretive: 15, ruthless: 5 },
          stockPriceDelta: 0,
          headline: 'Vantex culpa terceirizada por pequena falha de acesso',
          narrativeResolution: 'Abafamos a crise... por enquanto.'
        }
      }
    ]
  },
  {
    title: 'Greve na Linha de Montagem',
    urgency: 'medium',
    sourceDept: 'hr',
    baseProbability: 0.06,
    description: 'Os trabalhadores da principal fábrica terceirizada ameaçam cruzar os braços exigindo melhores condições e salários ajustados à inflação.',
    flavorQuote: '"Sem montagem, não há produto. Simples assim." — Gerente de Supply Chain',
    choices: [
      {
        id: 'market_strike_agree',
        label: 'Aceitar termos e reajustar salários',
        description: 'Aumenta custos trimestrais, mas evita paradas.',
        traitBadge: 'Pro-Trabalhador',
        outcomes: {
          cashDelta: -50000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { employees: 20, esg: 15 },
          traitDeltas: { ethical: 10 },
          stockPriceDelta: -0.30,
          headline: 'Vantex lidera acordo salarial e evita greve nas fábricas',
          narrativeResolution: 'Produção continua a todo vapor.'
        }
      },
      {
        id: 'market_strike_fight',
        label: 'Contratar temporários e furar a greve',
        description: 'Mantém margens, mas afunda a reputação ESG e moral interno.',
        traitBadge: 'Tubarão Implacável',
        outcomes: {
          cashDelta: -10000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { employees: -25, esg: -20 },
          traitDeltas: { ruthless: 15 },
          stockPriceDelta: 0.80,
          headline: 'Vantex fura greve com trabalhadores terceirizados; ESG em alerta',
          narrativeResolution: 'Os custos foram mantidos, mas a cultura da empresa sangra.'
        }
      }
    ]
  },
  {
    title: 'Viral Positivo Inesperado',
    urgency: 'low',
    sourceDept: 'marketing',
    baseProbability: 0.07,
    description: 'Um influenciador famoso usou nosso produto por acidente em uma live para milhões de pessoas. O engajamento está explodindo organicamente!',
    flavorQuote: '"O hype que o dinheiro não compra." — Diretor de Marketing',
    choices: [
      {
        id: 'market_viral_sponsor',
        label: 'Oferecer patrocínio oficial rápido ($30k)',
        description: 'Potencializa o momento e converte em vendas massivas.',
        traitBadge: 'Oportunista',
        outcomes: {
          cashDelta: -30000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: 25 },
          traitDeltas: { bold: 10 },
          stockPriceDelta: 1.50,
          headline: 'Vantex aproveita viral e dispara nas buscas semanais',
          narrativeResolution: 'O ROI da ação rápida foi estratosférico.'
        }
      },
      {
        id: 'market_viral_organic',
        label: 'Apenas surfar a onda organicamente',
        description: 'Sem custo, mas o efeito passa rápido.',
        traitBadge: 'Pragmático',
        outcomes: {
          cashDelta: 0,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: 10 },
          traitDeltas: {},
          stockPriceDelta: 0.40,
          headline: 'Produto da Vantex vira meme positivo na internet',
          narrativeResolution: 'Conseguimos um pico de vendas grátis.'
        }
      }
    ]
  },
  {
    title: 'Escassez de Silício (Chips)',
    urgency: 'critical',
    sourceDept: 'rd',
    baseProbability: 0.05,
    description: 'Fábricas em Taiwan reduziram a alocação de chips devido à falta d\'água severa. Nossa linha de produtos avançados vai atrasar a não ser que paguemos um ágio absurdo no mercado spot.',
    flavorQuote: '"Sem chip, somos apenas vendedores de plástico caro." — Líder de P&D',
    choices: [
      {
        id: 'market_chips_pay',
        label: 'Pagar ágio no mercado spot ($150k)',
        description: 'Garante o fornecimento, mas o custo sai direto do lucro líquido.',
        traitBadge: 'Entrega Acima de Tudo',
        outcomes: {
          cashDelta: -150000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { investors: -10, public: 10 },
          traitDeltas: { bold: 15 },
          stockPriceDelta: -0.50,
          headline: 'Vantex mantém produção em meio à crise global de chips, mas queima caixa',
          narrativeResolution: 'As prateleiras não ficaram vazias, protegendo nossa fatia de mercado.'
        }
      },
      {
        id: 'market_chips_delay',
        label: 'Atrasar entregas por 45 dias',
        description: 'Poupamos caixa, mas a concorrência vai nadar de braçada nas nossas costas.',
        traitBadge: 'Foco no Caixa',
        outcomes: {
          cashDelta: 0,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: -20, investors: -15 },
          traitDeltas: { cautious: 10 } as any,
          stockPriceDelta: -1.20,
          headline: 'Vantex adia entregas por falta de componentes e ações despencam',
          narrativeResolution: 'O mercado financeiro puniu severamente nossa falha de supply chain.'
        }
      }
    ]
  },
  {
    title: 'Processo Trabalhista do Ex-CTO',
    urgency: 'medium',
    sourceDept: 'legal',
    baseProbability: 0.05,
    description: 'O ex-CTO da gestão Vance abriu um processo trabalhista pedindo $250k de indenização por assédio moral e quebra de contrato.',
    flavorQuote: '"Ele era incompetente, mas o contrato que Vance assinou era blindado." — Advogado Chefe',
    choices: [
      {
        id: 'market_lawsuit_settle',
        label: 'Fazer acordo fora dos tribunais ($100k)',
        description: 'Resolve o problema silenciosamente.',
        traitBadge: 'Pragmático',
        outcomes: {
          cashDelta: -100000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: {},
          traitDeltas: { secretive: 10 },
          stockPriceDelta: 0,
          headline: 'Batalha judicial interna da Vantex é resolvida discretamente',
          narrativeResolution: 'Um cheque gordo garantiu o silêncio do ex-CTO.'
        }
      },
      {
        id: 'market_lawsuit_fight',
        label: 'Brigar na justiça até o fim',
        description: 'Não pagamos agora, mas custas legais mensais vão subir, e pode vazar na mídia.',
        traitBadge: 'Litigioso',
        outcomes: {
          cashDelta: -15000,
          debtDelta: 0,
          debtDaysDelta: 0,
          reputationDeltas: { public: -5, investors: -5 },
          traitDeltas: { bold: 10, ruthless: 5 },
          stockPriceDelta: -0.30,
          headline: 'Ex-CTO arrasta Vantex para os tribunais em processo polêmico',
          narrativeResolution: 'A batalha jurídica vai longe e a imprensa adora a fofoca.'
        }
      }
    ]
  }
];
