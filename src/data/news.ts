import { NewsArticle, GameState } from '../types';

export const INITIAL_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news_init_1',
    day: 1,
    quarter: 1,
    source: 'TechPulse News',
    author: 'Renan Vasques (TechPulse Lead Editor)',
    category: 'vantex',
    title: 'BOMBA: Vantex Dynamics à beira do abismo após fuga cinematográfica de Arthur Vance',
    snippet: 'O ex-CEO deixou um rombo de meio milhão no Confiança Federal e sumiu em um iate no Mediterrâneo. O conselho nomeou novo CEO com ultimato de 90 dias.',
    fullContent: `O mercado financeiro e a comunidade de tecnologia de São Paulo foram pegos de surpresa na manhã desta segunda-feira. A Vantex Dynamics, outrora aclamada como a grande promessa de software corporativo nacional, está à beira da falência.

Documentos obtidos pelo TechPulse News revelam que o fundador e ex-CEO, Arthur Vance, falsificou balanços fiscais durante dois anos antes de embarcar em um jatinho particular para a Europa. Nos cofres da empresa, restou uma dívida executável de $500.000 junto ao banco estatal Confiança Federal.

Fontes do comitê de credores afirmam que o novo CEO interino terá menos de um trimestre para estancar a sangria financeira e evitar que servidores físicos sejam leiloados no ferro-velho judicial. A ação $VNTX despenca no pré-mercado e analistas de risco recomendam cautela extrema aos investidores.`,
    sentiment: 'bearish',
    marketImpact: '$VNTX -45.2% no pregão de abertura',
  },
  {
    id: 'news_init_2',
    day: 1,
    quarter: 1,
    source: 'Wall Street Dispatch',
    author: 'Margaret Sterling',
    category: 'market',
    title: 'Confiança Federal aciona vara de falências contra a Vantex Dynamics',
    snippet: 'Dr. Osvaldo Barreto emite aviso categórico: "Sem pagamento consistente até o dia 90, os lacres judiciais serão colocados na sede da empresa".',
    fullContent: `O departamento de execuções especiais do banco Confiança Federal não concederá carência extra para startups insolventes. O procurador Dr. Osvaldo Barreto confirmou em nota formal que a Vantex Dynamics está em regime de contagem regressiva estrita.

"Instituições financeiras sérias não operam na base de sonhos de garagem. Há garantias reais vinculadas à patente do software principal. Se a amortização não ocorrer, a massa falida será transferida para custódia judicial", declarou Barreto.

Enquanto isso, fundos abutres como a Rockridge Capital já rondam os corredores do tribunal, esperando arrematar o código-fonte por centavos de dólar.`,
    sentiment: 'bearish',
    marketImpact: 'Risco de crédito elevado para rating C',
  },
  {
    id: 'news_init_3',
    day: 1,
    quarter: 1,
    source: 'Silicon Valley Insider',
    author: 'Chloe Simmons',
    category: 'rivals',
    title: 'Amazora e Orange Inc. disputam hegemonia em computação quântica e logística autônoma',
    snippet: 'Logan Clark (Amazora) e Tim Orchard (Orange) trocam farpas públicas enquanto Metaphase anuncia corte de 10.000 avatares em seu metaverso.',
    fullContent: `Enquanto pequenas empresas lutam pela sobrevivência, os titãs da tecnologia continuam suas guerras de trilhões de dólares.

A Amazora anunciou a expansão de seus armazéns 100% robotizados, prometendo entregas urbanas em 7 minutos. Em resposta irônica, Tim Orchard da Orange Inc. apresentou um novo fone de ouvido de titânio escovado que custa o mesmo que um carro popular, alegando que "a simplicidade é o ápice do luxo".

Paralelamente, a Metaphase de Zack Meta sofreu forte desvalorização após analistas apontarem que 80% dos usuários ativos em seus mundos virtuais são bots programados pela própria empresa para inflar relatórios a investidores.`,
    sentiment: 'neutral',
    relatedBrand: 'amazora',
    marketImpact: 'Setor de Big Tech registra alta de 1.8%',
  },
];

// Helper to generate dynamic news reacting to player events
export function generateDynamicNewsArticle(type: string, payload: any, day: number, quarter: number): NewsArticle {
  const id = `news_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  switch (type) {
    case 'product_launch':
      return {
        id,
        day,
        quarter,
        source: 'TechPulse News',
        author: 'Guilherme Telles (Editor de Hardware & Software)',
        category: 'vantex',
        title: `Vantex Dynamics lança oficialmente ${payload.productName} e surpreende o mercado`,
        snippet: `Com índice de qualidade de ${payload.quality}/100, o novo lançamento da Vantex coloca a empresa de volta no radar de grandes clientes corporativos.`,
        fullContent: `Em uma apresentação transmitida ao vivo para milhares de desenvolvedores e diretores de TI, o CEO da Vantex Dynamics revelou a versão final de ${payload.productName}.

Especialistas em benchmarking elogiaram a estabilidade técnica e a velocidade de processamento, destacando que a nova liderança conseguiu transformar um legado caótico em um produto competitivo. Clientes corporativos começaram a migrar licenças de teste para planos comerciais anuais, impulsionando a curva de receita trimestral da companhia.`,
        sentiment: 'bullish',
        marketImpact: '$VNTX +14.6% após conferência de produto',
      };

    case 'debt_amortization':
      return {
        id,
        day,
        quarter,
        source: 'Wall Street Dispatch',
        author: 'Eduardo Falcão',
        category: 'vantex',
        title: `Vantex amortiza $${payload.amount.toLocaleString()} e alivia cerco do Confiança Federal`,
        snippet: `O banco estatal registrou a entrada dos recursos. Investidores institucionais voltam a olhar com bons olhos a solvência da startup.`,
        fullContent: `Em manobra financeira estratégica, a diretoria executiva da Vantex Dynamics realizou uma amortização extraordinária de sua dívida. Fontes do Confiança Federal confirmaram a liquidação pontual da parcela, afastando a iminência de penhoras judiciais imediatas.

Analistas de mercado destacaram a disciplina orçamentária do CEO e a capacidade de gerar fluxo de caixa operacional mesmo sob forte pressão de credores.`,
        sentiment: 'bullish',
        marketImpact: 'Rating de crédito elevado de C para BB+',
      };

    case 'rival_deal_signed':
      return {
        id,
        day,
        quarter,
        source: 'TechPulse News',
        author: 'Clarice Prado',
        category: 'rivals',
        title: `ALIANÇA: Vantex Dynamics fecha acordo estratégico de alto escalão com ${payload.partnerName}`,
        snippet: `O contrato traz injeção de capital e cooperação técnica mútua, abalando concorrentes diretos no setor.`,
        fullContent: `A mesa de negociações produziu um dos desfechos mais improváveis da temporada corporativa. O CEO da Vantex assinou formalmente uma parceria com ${payload.partnerName} (${payload.partnerCompany}).

O acordo prevê integração de ecossistemas digitais e divisão de receitas. Executivos de corporações rivais foram pegos desprevenidos nos corredores do Vale, enquanto as ações da Vantex registraram forte valorização no pregão.`,
        sentiment: 'bullish',
        relatedBrand: payload.brandId,
        marketImpact: '$VNTX dispara no mercado secundário',
      };

    case 'crisis_resolved':
      return {
        id,
        day,
        quarter,
        source: payload.sentiment === 'scandal' ? 'O Fuxico Corporativo' : 'TechPulse News',
        author: 'Investigação Especial TechPulse',
        category: payload.sentiment === 'scandal' ? 'scandal' : 'vantex',
        title: payload.headline || 'Decisão no Conselho da Vantex reverbera no ecossistema corporativo',
        snippet: payload.snippet || 'A postura adotada pelo CEO definiu o futuro da governança e causou forte repercussão na bolsa.',
        fullContent: payload.narrative || 'Após reunião extraordinária a portas fechadas, o comitê executivo divulgou as medidas tomadas para lidar com o recente impasse corporativo. Representantes do mercado avaliam que o posicionamento da liderança será determinante para os próximos trimestres.',
        sentiment: payload.sentiment || 'neutral',
        marketImpact: payload.impactText || 'Oscilação nos papéis da companhia',
      };

    case 'key_talent_hired':
      return {
        id,
        day,
        quarter,
        source: 'Silicon Valley Insider',
        author: 'Rodrigo Bastos',
        category: 'vantex',
        title: `MERCADO DE TALENTOS: Vantex contrata ${payload.talentName} em jogada de mestre`,
        snippet: `O ex-${payload.title} junta-se ao time executivo da Vantex trazendo a habilidade única "${payload.perkName}".`,
        fullContent: `A Vantex Dynamics continua atraindo mentes brilhantes do mercado de tecnologia. A contratação de ${payload.talentName} foi celebrada pela comunidade técnica como uma das mais audaciosas do trimestre.

Com vasta bagagem executiva e reconhecimento internacional, a nova contratação assume posição-chave no departamento para acelerar a transformação da Vantex em líder de mercado. Concorrentes expressaram preocupação velada com o fortalecimento do quadro técnico da rival.`,
        sentiment: 'bullish',
        marketImpact: 'Aumento na percepção de valor patrimonial',
      };

    case 'rival_competitor_news':
      return {
        id,
        day,
        quarter,
        source: 'TechPulse News',
        author: 'Redação TechPulse',
        category: 'rivals',
        title: payload.title,
        snippet: payload.snippet,
        fullContent: payload.fullContent,
        sentiment: payload.sentiment,
        relatedBrand: payload.relatedBrand,
        marketImpact: payload.marketImpact,
      };

    default:
      return {
        id,
        day,
        quarter,
        source: 'TechPulse News',
        author: 'Correspondente Financeiro',
        category: 'market',
        title: 'Balanço corporativo trimestral movimenta as bolsas de valores',
        snippet: 'Investidores acompanham de perto os números de margem operacional e fluxo de caixa das empresas de tecnologia.',
        sentiment: 'neutral',
      };
  }
}

// Random competitor headlines that populate periodically
export const RIVAL_PERIODIC_NEWS: Omit<NewsArticle, 'id' | 'day' | 'quarter'>[] = [
  {
    source: 'TechPulse News',
    author: 'Lucas Paiva',
    category: 'rivals',
    title: 'Amazora é processada por reguladores por monopolizar rotas de drones urbanos',
    snippet: 'Logan Clark afirma que os drones são ecológicos, mas prefeituras apontam queda de pacotes e poluição sonora em bairros nobres.',
    fullContent: `A divisão de transporte aéreo da Amazora Logistics está sob fogo cruzado. Mais de 40 municípios notificaram a empresa após enxames de drones de entrega causarem congestionamento em espaço aéreo de baixa altitude. Em entrevista coletiva, Logan Clark minimizou o problema: "Quem quer entrega em 5 minutos não pode reclamar do zumbido do progresso."`,
    sentiment: 'scandal',
    relatedBrand: 'amazora',
    marketImpact: 'Ações da Amazora oscilam -2.3%',
  },
  {
    source: 'Silicon Valley Insider',
    author: 'Samira Haddad',
    category: 'rivals',
    title: 'Metaphase sofre vazamento de 50 milhões de identidades biométricas virtuais',
    snippet: 'Zack Meta convoca coletiva de emergência com seu avatar de gravata borboleta para acalmar acionistas em pânico.',
    fullContent: `Uma vulnerabilidade crítica na API de mapeamento facial do headset da Metaphase permitiu a captura de dados biométricos de dezenas de milhões de usuários. Grupos de proteção ao consumidor exigem multas na casa dos bilhões de dólares, enquanto Zack Meta alegou que os usuários deveriam se sentir gratos por "terem suas essências digitalizadas para a eternidade".`,
    sentiment: 'scandal',
    relatedBrand: 'metaphase',
    marketImpact: 'Queda de 4.5% no índice Nasdaq',
  },
  {
    source: 'Wall Street Dispatch',
    author: 'Thomas Sterling',
    category: 'rivals',
    title: 'Orange Inc. anuncia carregador vendido por $199 sem cabo na caixa',
    snippet: 'Tim Orchard defende a decisão em nome do "minimalismo cósmico", e filas de clientes dobram a esquina da 5ª Avenida.',
    fullContent: `A Orange Inc. surpreendeu o mercado mais uma vez ao lançar sua nova estação de força ultracompacta. O dispositivo não inclui cabo, conector de tomada ou manual impresso. "Remover tudo é o ato supremo de design", afirmou Tim Orchard no palco estéril da sede em Cupertino. Apesar das críticas nas redes sociais, os estoques esgotaram em 12 minutos.`,
    sentiment: 'neutral',
    relatedBrand: 'orange',
    marketImpact: 'Orange atinge novo recorde histórico de $3 trilhões',
  },
  {
    source: 'TechPulse News',
    author: 'Renan Vasques',
    category: 'rivals',
    title: 'WinSoft Corp força atualização automática de sistema no meio de votação no Senado',
    snippet: 'Telas azuis interromperam a sessão parlamentar por 3 horas. Vance Gates pede "desculpas pelo aperfeiçoamento da segurança".',
    fullContent: `Uma falha de empacotamento na atualização do WinSoft Enterprise fez com que milhares de computadores governamentais reiniciassem simultaneamente durante a votação da lei de inteligência artificial. Os parlamentares ficaram enfurecidos, mas Vance Gates declarou que a proteção contra ameaças digitais não pode esperar o fim de discursos políticos.`,
    sentiment: 'bearish',
    relatedBrand: 'winsoft',
    marketImpact: 'WinSoft cede 1.1% na bolsa de Nova York',
  },
];
