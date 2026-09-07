/**
 * CEO Empire - Local Negotiation Engine (100% Offline / Deterministic / Procedural)
 * Substitui chamadas externas de IA por detecção de intenção via NLP leve,
 * controle de humor, análise de agressividade, extração de valores financeiros e pools dinâmicos.
 */

export interface AnaliseMensagem {
  categorias: string[];       // pode detectar mais de uma ao mesmo tempo
  valorMencionado: number | null;
  agressividadeExtra: number; // 0-20, soma ao patienceDelta negativo
  contemPalavrao: boolean;
}

export interface RespostaTemplate {
  id: string;
  texto: string;           // usa {valor}, {empresa}, {nomeJogador}, {paciencia} como placeholders
  patienceDelta: number;
  mood: "furious" | "skeptical" | "neutral" | "interested" | "convinced";
  dealOfferedTemplate?: string;
  consequence?: {
    cashDelta?: number;
    debtDelta?: number;
    debtDaysExtension?: number;
    equityTaken?: number;
    reputationDelta?: number;
  };
}

export interface HistoricoNegociacao {
  ultimasCategorias: string[]; // mantém só as últimas 2
  ultimoTemplateId: string | null;
}

// Lista enxuta de termos ofensivos comuns em pt-BR
const PALAVROES_PTBR = [
  'porra',
  'caralho',
  'merda',
  'puta',
  'foder',
  'foda',
  'fodase',
  'foda-se',
  'bosta',
  'cacete',
  'arrombado',
  'babaca',
  'idiota',
  'desgraca',
  'desgraça',
  'filho da puta',
  'fdp'
];

/**
 * Normaliza o texto removendo acentos e convertendo para minúsculas
 */
export function normalizarTexto(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Extrai o maior valor monetário mencionado na mensagem
 */
export function extrairValorNumerico(textoOriginal: string): number | null {
  const normalizado = normalizarTexto(textoOriginal);
  const regex = /(\d+(?:[.,]\d+)?)\s*(mil|milhao|milhoes|k|m)?\b/gi;
  let matches: RegExpExecArray | null;
  const valores: number[] = [];

  while ((matches = regex.exec(normalizado)) !== null) {
    let rawNumStr = matches[1];
    const sufixo = matches[2]?.toLowerCase();

    // Tratamento de formato: se tiver ponto como milhar (ex: 100.000 ou 500.000 sem decimal)
    if (/^\d{1,3}\.\d{3}(?:\.\d{3})*$/.test(rawNumStr)) {
      rawNumStr = rawNumStr.replace(/\./g, '');
    } else {
      rawNumStr = rawNumStr.replace(',', '.');
    }

    let num = parseFloat(rawNumStr);
    if (isNaN(num)) continue;

    if (sufixo === 'mil' || sufixo === 'k') {
      num *= 1000;
    } else if (sufixo === 'milhao' || sufixo === 'milhoes' || sufixo === 'm') {
      num *= 1000000;
    }

    if (num > 0) {
      valores.push(Math.round(num));
    }
  }

  if (valores.length === 0) return null;
  return Math.max(...valores);
}

/**
 * 1. DETECÇÃO DE INTENÇÃO NO TEXTO DO JOGADOR
 */
export function analisarMensagem(textoOriginal: string): AnaliseMensagem {
  const textoNorm = normalizarTexto(textoOriginal);
  const valorMencionado = extrairValorNumerico(textoOriginal);

  // Detecção de palavrões
  let contemPalavrao = false;
  for (const termo of PALAVROES_PTBR) {
    const termoNorm = normalizarTexto(termo);
    const regexPalavrao = new RegExp(`\\b${termoNorm}\\b`, 'i');
    if (regexPalavrao.test(textoNorm) || textoNorm.includes(termoNorm)) {
      contemPalavrao = true;
      break;
    }
  }

  // Cálculo da agressividade extra (0 - 20)
  let agressividade = 0;

  // 1. Proporção de CAPS > 40% (mínimo de 6 letras)
  const apenasLetras = (textoOriginal || '').replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (apenasLetras.length >= 6) {
    const maiusculas = (textoOriginal || '').replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕ]/g, '').length;
    if (maiusculas / apenasLetras.length > 0.4) {
      agressividade += 5;
    }
  }

  // 2. Pontos de exclamação além do primeiro (cap em +15)
  const countExclamacoes = (textoOriginal.match(/!/g) || []).length;
  if (countExclamacoes > 1) {
    const bonusExcl = (countExclamacoes - 1) * 5;
    agressividade += Math.min(15, bonusExcl);
  }

  // 3. Palavrões somam +10
  if (contemPalavrao) {
    agressividade += 10;
  }

  const agressividadeExtra = Math.min(20, Math.max(0, agressividade));

  // Detecção de categorias
  const categorias: string[] = [];

  // - ameaca
  const regexAmeaca = /\b(processo|justica|advogad[a-z]*|midia|imprensa|denunci[a-z]*|expo[a-z]*|vazar|prejudicar|destruir|acabar com)\b/i;
  if (regexAmeaca.test(textoNorm)) {
    categorias.push('ameaca');
  }

  // - dados_financeiros
  const regexDados = /\b(receita|faturamento|margem|lucro|ebitda|crescimento|projecao|plano de negocio)\b/i;
  if (regexDados.test(textoNorm) || (valorMencionado !== null && valorMencionado >= 1000)) {
    categorias.push('dados_financeiros');
  }

  // - oferta_equity
  const regexEquity = /\b(equity|participacao|acoes|socio|conselho|cadeira no board)\b/i;
  if (regexEquity.test(textoNorm)) {
    categorias.push('oferta_equity');
  }

  // - blefe (afirmação de outro parceiro/fundo SEM número mencionado)
  const regexBlefe = /\b(outro (banco|investidor|comprador)|tenho outra proposta|fundo soberano|em breve|garantido)\b/i;
  if (regexBlefe.test(textoNorm) && (valorMencionado === null || valorMencionado <= 0)) {
    categorias.push('blefe');
  }

  // - bajulacao
  const regexBajulacao = /\b(admiro|respeito|sua reputacao|sua experiencia|parabens|excelente trabalho)\b/i;
  if (regexBajulacao.test(textoNorm)) {
    categorias.push('bajulacao');
  }

  // - humildade
  const regexHumildade = /\b(desculp[a-z]*|erro foi meu|reconheco|assumo a responsabilidade|peco (a )?compreensao)\b/i;
  if (regexHumildade.test(textoNorm)) {
    categorias.push('humildade');
  }

  // - indiferenca (texto muito curto ou sem intenção declarada)
  const verbosProposta = /\b(proponho|ofereco|pago|fechar|aceit[a-z]*|acordo|compr[a-z]*|vend[a-z]*|invest[a-z]*|estend[a-z]*|negoci[a-z]*)\b/i;
  if (textoNorm.trim().length < 15 || (!verbosProposta.test(textoNorm) && categorias.length === 0)) {
    categorias.push('indiferenca');
  }

  return {
    categorias,
    valorMencionado,
    agressividadeExtra,
    contemPalavrao,
  };
}

/**
 * 2. POOLS DE RESPOSTA COM SLOTS DINÂMICOS
 */
export function preencherTemplate(
  template: string,
  ctx: {
    valor: number | null;
    empresa: string;
    nomeJogador: string;
    paciencia: number;
  }
): string {
  let res = template;
  const valorFormatado = ctx.valor !== null
    ? `$${ctx.valor.toLocaleString('pt-BR')}`
    : 'esta cifra';

  res = res.replace(/\{valor\}/g, valorFormatado);
  res = res.replace(/\{empresa\}/g, ctx.empresa || 'Vantex Dynamics');
  res = res.replace(/\{nomeJogador\}/g, ctx.nomeJogador || 'CEO');
  res = res.replace(/\{paciencia\}/g, String(ctx.paciencia ?? 50));
  return res;
}

// Ordem de prioridade de categorias conforme instrução:
// ameaca > oferta_equity > dados_financeiros > blefe > bajulacao > humildade > indiferenca
export const ORDEM_PRIORIDADE = [
  'ameaca',
  'oferta_equity',
  'dados_financeiros',
  'blefe',
  'bajulacao',
  'humildade',
  'indiferenca',
];

export const RESPOSTAS: Record<string, Record<string, RespostaTemplate[]>> = {
  // 1. Dr. Osvaldo Barreto - Confiança Federal
  confianca_barreto: {
    dados_financeiros: [
      {
        id: 'barreto_data_1',
        texto: 'Hmm... {valor} é um número interessante para amortizar o rombo do Arthur Vance, mas o Confiança Federal precisa de liquidez imediata. Apresente garantias sobre os recebíveis da {empresa}.',
        patienceDelta: 12,
        mood: 'interested',
        dealOfferedTemplate: 'Extensão extraordinária de 45 dias mediante amortização imediata de {valor}.',
        consequence: { debtDaysExtension: 45 },
      },
      {
        id: 'barreto_data_2',
        texto: 'Vejo que você trouxe números desta vez, {nomeJogador}. Se você depositar {valor} agora em conta de custódia, posso segurar o oficial de justiça por mais duas semanas.',
        patienceDelta: 10,
        mood: 'neutral',
        dealOfferedTemplate: 'Suspensão provisória da execução fiscal por 30 dias mediante aporte em juízo de {valor}.',
        consequence: { debtDaysExtension: 30 },
      },
      {
        id: 'barreto_data_3',
        texto: '{valor}? Isso mal cobre os juros acumulados do último trimestre fiscal, CEO. Não confunda minha paciência burocrática com caridade bancária.',
        patienceDelta: -4,
        mood: 'skeptical',
      },
      {
        id: 'barreto_data_no_val_1',
        texto: 'Planilhas aceitam qualquer projeção, {nomeJogador}. O que o comitê do Confiança Federal quer ver é dinheiro compensado na conta da tesouraria.',
        patienceDelta: 5,
        mood: 'neutral',
      },
    ],
    ameaca: [
      {
        id: 'barreto_threat_1',
        texto: 'Você ousa me ameaçar dentro do meu próprio gabinete? O Confiança Federal financiou governos antes de você aprender a abrir uma planilha no Excel. Mais uma palavra hostil e aciono o arresto de bens da {empresa}!',
        patienceDelta: -25,
        mood: 'furious',
      },
      {
        id: 'barreto_threat_2',
        texto: 'Chamar advogados para mim, {nomeJogador}? Meu departamento jurídico tem 40 procuradores concursados que adoram liquidar startups falidas antes do cafezinho das dez.',
        patienceDelta: -22,
        mood: 'furious',
      },
      {
        id: 'barreto_threat_3',
        texto: 'Ameaças de vazamento de mídia só aceleram o bloqueio judicial dos servidores da {empresa}. Você está cavando a própria cova corporativa.',
        patienceDelta: -20,
        mood: 'skeptical',
      },
    ],
    oferta_equity: [
      {
        id: 'barreto_equity_1',
        texto: 'O Confiança Federal não é fundo de venture capital para aceitar papel pintado da {empresa}. Porém, nosso braço de participações aceitaria 8% em ações preferenciais para estender o prazo em 90 dias.',
        patienceDelta: 14,
        mood: 'convinced',
        dealOfferedTemplate: 'Renegociação com carência de 90 dias em troca de 8% de ações preferenciais da {empresa}.',
        consequence: { debtDaysExtension: 90, equityTaken: 8 },
      },
      {
        id: 'barreto_equity_2',
        texto: 'Ações de uma empresa em recuperação judicial? O risco de compliance é gigantesco. Mas se o conselho aprovar assento de auditor independente, podemos pausar as cobranças.',
        patienceDelta: 8,
        mood: 'interested',
      },
      {
        id: 'barreto_equity_3',
        texto: 'Oferecer equity sem auditoria de balanço é piada, {nomeJogador}. O rombo de Arthur Vance ainda mancha cada certificado de ações emitido por vocês.',
        patienceDelta: -5,
        mood: 'skeptical',
      },
    ],
    blefe: [
      {
        id: 'barreto_bluff_1',
        texto: 'Esse papo furado de "outro banco refinanciando" ou "fundo soberano entrando" não cola comigo. Arthur Vance usava exatamente essas mesmas palavras antes de fugir com o jatinho.',
        patienceDelta: -18,
        mood: 'skeptical',
      },
      {
        id: 'barreto_bluff_2',
        texto: 'Se você realmente tem outro credor disposto a comprar essa dívida podre, me traga a minuta com firma reconhecida até às 17h. Caso contrário, considere a execução iniciada.',
        patienceDelta: -12,
        mood: 'neutral',
      },
      {
        id: 'barreto_bluff_3',
        texto: 'Promessas vagas de capital salvador sem nenhum documento comprobatório? Minha paciência com fábulas de Silicon Valley acabou no século passado.',
        patienceDelta: -15,
        mood: 'skeptical',
      },
    ],
    bajulacao: [
      {
        id: 'barreto_flatter_1',
        texto: 'Elogios à minha carreira de 35 anos no funcionalismo público não quitam o balancete, mas demonstram que você ao menos tem compostura executiva.',
        patienceDelta: 4,
        mood: 'neutral',
      },
      {
        id: 'barreto_flatter_2',
        texto: 'Pelo menos o novo CEO tem modos mais refinados que o delinquente anterior. Mas continuemos focados no cronograma de desembolso.',
        patienceDelta: 6,
        mood: 'neutral',
      },
      {
        id: 'barreto_flatter_3',
        texto: 'Adulação barata não dobra o Confiança Federal, {nomeJogador}. Seja direto e me mostre o cronograma de liquidação.',
        patienceDelta: -2,
        mood: 'skeptical',
      },
    ],
    humildade: [
      {
        id: 'barreto_humble_1',
        texto: 'Reconhecer a gravidade da situação herdada é o primeiro passo sensato que vejo da {empresa} em meses. Se você assumir o compromisso por escrito, posso flexibilizar a multa rescisória.',
        patienceDelta: 12,
        mood: 'interested',
        dealOfferedTemplate: 'Redução de 50% das multas moratórias mediante confissão de dívida firmada pelo CEO.',
        consequence: { debtDelta: -50000 },
      },
      {
        id: 'barreto_humble_2',
        texto: 'Pedir compreensão é fácil quando o dinheiro dos correntistas está pendurado. Mas aprecio sua honestidade ao encarar o passivo.',
        patienceDelta: 7,
        mood: 'neutral',
      },
      {
        id: 'barreto_humble_3',
        texto: 'Desculpas não pagam a folha dos oficiais de execução, mas evitam que eu encerre esta reunião imediatamente.',
        patienceDelta: 3,
        mood: 'skeptical',
      },
    ],
    indiferenca: [
      {
        id: 'barreto_indiff_1',
        texto: 'Respostas monossilábicas e enrolação? Tenho três processos de liquidação judicial para despachar hoje. Apresente algo substantivo ou saia da minha sala.',
        patienceDelta: -12,
        mood: 'skeptical',
      },
      {
        id: 'barreto_indiff_2',
        texto: 'O relógio está correndo contra a {empresa}. Seu silêncio evasivo só comprova a insolvência da sua gestão.',
        patienceDelta: -10,
        mood: 'skeptical',
      },
    ],
    repeticao: [
      {
        id: 'barreto_repeat',
        texto: 'Você já tentou esse mesmo argumento exato na rodada anterior, CEO {nomeJogador}. O Confiança Federal não é disco riscado. Traga uma contraproposta inédita ou a conversa acaba aqui.',
        patienceDelta: -15,
        mood: 'furious',
      },
    ],
  },

  // 2. Gordon Stone - RockRidge Capital (Fundo abutre de Wall Street)
  rockridge_stone: {
    dados_financeiros: [
      {
        id: 'stone_data_1',
        texto: '{valor} de margem ou aporte projetado? Se esse EBITDA for real e auditável pela Deloitte, colocamos capital mezanino amanhã na {empresa}.',
        patienceDelta: 15,
        mood: 'convinced',
        dealOfferedTemplate: 'Aporte de salvamento de {valor} estruturado via dívida conversível com bônus de subscrição.',
        consequence: { cashDelta: 500000, debtDaysExtension: 60 },
      },
      {
        id: 'stone_data_2',
        texto: 'Gosto de ver números na mesa, {nomeJogador}. Se você sustentar {valor} de receita bruta no trimestre, eu lidero uma rodada para recomprar sua dívida podre com 40% de deságio.',
        patienceDelta: 12,
        mood: 'interested',
      },
      {
        id: 'stone_data_3',
        texto: '{valor}? Pensei que você quisesse jogar na liga principal. Essa merreca não paga nem os honorários de M&A dos meus advogados em Nova York.',
        patienceDelta: -5,
        mood: 'skeptical',
      },
      {
        id: 'stone_data_no_val_1',
        texto: 'Gráficos ascendentes sem comprovação contábil são apenas contos de fadas para venture capital amador. A RockRidge só morde carne com osso.',
        patienceDelta: 4,
        mood: 'neutral',
      },
    ],
    ameaca: [
      {
        id: 'stone_threat_1',
        texto: 'Ameaças são a munição de quem já esgotou o fluxo de caixa, CEO. Nós compramos debêntures estressadas no café da manhã e liquidamos conselhos de administração no almoço. Baixe a bola.',
        patienceDelta: -22,
        mood: 'furious',
      },
      {
        id: 'stone_threat_2',
        texto: 'Processos judiciais? Eu tenho um andar inteiro de sócios em Manhattan que almoçam petições de falência. Você não tem fichas para blefar comigo.',
        patienceDelta: -18,
        mood: 'skeptical',
      },
      {
        id: 'stone_threat_3',
        texto: 'Tentar nos constranger publicamente só faz o preço de resgate da {empresa} cair mais 15%. Continue e eu compro sua dívida e leiloo sua marca.',
        patienceDelta: -20,
        mood: 'furious',
      },
    ],
    oferta_equity: [
      {
        id: 'stone_equity_1',
        texto: 'Agora você começou a falar minha língua. Colocamos capital novo na {empresa} imediatamente, mas quero 22% de equity e o poder de veto no seu comitê de gastos.',
        patienceDelta: 18,
        mood: 'convinced',
        dealOfferedTemplate: 'Injeção de $1.200.000 em troca de 22% de equity e duas cadeiras no Conselho.',
        consequence: { cashDelta: 1200000, equityTaken: 22 },
      },
      {
        id: 'stone_equity_2',
        texto: 'Participação acionária na Vantex dilui meu portfólio de risco, a menos que venha com preferência de liquidação 2x. Topa assinar a minuta hoje?',
        patienceDelta: 14,
        mood: 'interested',
      },
      {
        id: 'stone_equity_3',
        texto: 'Cadeiras no conselho? Eu quero controle real. Não financio viagens de ego de fundador.',
        patienceDelta: 6,
        mood: 'neutral',
      },
    ],
    blefe: [
      {
        id: 'stone_bluff_1',
        texto: 'Dizer que tem outro investidor na fila sem mostrar o Term Sheet assinado? Trabalho com distressed assets desde a crise de 2008. Reconheço desespero a três quarteirões.',
        patienceDelta: -16,
        mood: 'skeptical',
      },
      {
        id: 'stone_bluff_2',
        texto: 'Fundo soberano entrando na {empresa}? Ninguém do Oriente Médio coloca dinheiro em uma empresa cujo fundador anterior está na lista da Interpol. Menos fantasia, CEO.',
        patienceDelta: -14,
        mood: 'furious',
      },
      {
        id: 'stone_bluff_3',
        texto: 'Se sua outra proposta fosse tão fantástica, você não estaria batendo na porta de um fundo predador como a RockRidge.',
        patienceDelta: -10,
        mood: 'skeptical',
      },
    ],
    bajulacao: [
      {
        id: 'stone_flatter_1',
        texto: 'Elogiar meu histórico de aquisições hostis não vai me fazer baixar a taxa de retorno exigida. Mas pelo menos você sabe quem manda na mesa.',
        patienceDelta: 5,
        mood: 'neutral',
      },
      {
        id: 'stone_flatter_2',
        texto: 'Poupe a bajulação para os anjos de estágio semente. Aqui na RockRidge só ligamos para retorno sobre o capital investido.',
        patienceDelta: 1,
        mood: 'neutral',
      },
      {
        id: 'stone_flatter_3',
        texto: 'Muito cordial, {nomeJogador}. Agora vamos ao que interessa: quantos centavos por dólar você quer na sua reestruturação?',
        patienceDelta: 3,
        mood: 'neutral',
      },
    ],
    humildade: [
      {
        id: 'stone_humble_1',
        texto: 'Em Wall Street, fraqueza declarada é convite para ser devorado. Mas admitir que o modelo anterior faliu me poupa tempo de due diligence.',
        patienceDelta: 6,
        mood: 'neutral',
      },
      {
        id: 'stone_humble_2',
        texto: 'Não me peça compreensão, CEO. Me mostre o plano de corte de 30% da sua folha de pagamento e eu dou fôlego financeiro para a {empresa}.',
        patienceDelta: 4,
        mood: 'skeptical',
      },
      {
        id: 'stone_humble_3',
        texto: 'Pedir desculpas aos credores é inútil. Capital não tem sentimentos. Quer salvar a empresa? Reduza seu salário a $1 e me dê garantias.',
        patienceDelta: -2,
        mood: 'skeptical',
      },
    ],
    indiferenca: [
      {
        id: 'stone_indiff_1',
        texto: 'Tempo é o único ativo não renovável, {nomeJogador}. A cada minuto de silêncio vazio, o valuation da {empresa} sangra 2%. Apresente uma oferta ou a porta é logo ali.',
        patienceDelta: -14,
        mood: 'furious',
      },
      {
        id: 'stone_indiff_2',
        texto: 'Se você não tem nada a propor, vou atender o telefone de um concorrente seu que acabou de entrar em leilão judicial.',
        patienceDelta: -12,
        mood: 'skeptical',
      },
    ],
    repeticao: [
      {
        id: 'stone_repeat',
        texto: 'Repetir a mesma conversa mole pela segunda vez seguida, CEO? Na RockRidge cortamos cabeças por perda de tempo. Mude a proposta imediatamente ou a reunião acaba.',
        patienceDelta: -18,
        mood: 'furious',
      },
    ],
  },

  // 3. Camila Lins - NuVerde Fintech (Inovação, APIs, sustentabilidade & ESG)
  nuverde_lins: {
    dados_financeiros: [
      {
        id: 'nuverde_data_1',
        texto: 'Adorei a clareza dessa projeção de {valor}! Se os testes de escalabilidade da {empresa} sustentarem esse volume, abrimos uma linha de crédito rotativo a taxas subsidiadas.',
        patienceDelta: 16,
        mood: 'convinced',
        dealOfferedTemplate: 'Linha de crédito verde de {valor} a juros de 1.1% ao mês com integração da API Vantex.',
        consequence: { cashDelta: 450000, debtDaysExtension: 90 },
      },
      {
        id: 'nuverde_data_2',
        texto: 'Esses números de eficiência energética e receita são animadores, {nomeJogador}. Se você garantir métricas abertas de software, podemos adiantar recebíveis.',
        patienceDelta: 12,
        mood: 'interested',
      },
      {
        id: 'nuverde_data_3',
        texto: '{valor} é um número expressivo, mas qual é a pegada de carbono e o custo de infraestrutura em nuvem para alcançar essa meta?',
        patienceDelta: 6,
        mood: 'neutral',
      },
      {
        id: 'nuverde_data_no_val_1',
        texto: 'Dados abertos e transparência corporativa são pilares da NuVerde. Gostei de ver seu compromisso com relatórios sérios após a tempestade.',
        patienceDelta: 9,
        mood: 'interested',
      },
    ],
    ameaca: [
      {
        id: 'nuverde_threat_1',
        texto: 'Essa postura hostil e litigiosa é exatamente o motivo pelo qual o ecossistema fintech quer enterrar a velha guarda de executivos tóxicos. Baixe o tom.',
        patienceDelta: -22,
        mood: 'furious',
      },
      {
        id: 'nuverde_threat_2',
        texto: 'Ameaçar vazamentos ou pressão midiática viola frontalmente nosso código de conduta ESG. Se repetir isso, cancelo a parceria no mesmo instante.',
        patienceDelta: -20,
        mood: 'furious',
      },
      {
        id: 'nuverde_threat_3',
        texto: 'Advogados agressivos não constroem produtos inovadores, {nomeJogador}. Esperava mais liderança da sua gestão na {empresa}.',
        patienceDelta: -15,
        mood: 'skeptical',
      },
    ],
    oferta_equity: [
      {
        id: 'nuverde_equity_1',
        texto: 'Equity da {empresa}? A NuVerde prefere parcerias estratégicas de fornecimento a comprar controle, mas 5% em troca de integração de pagamentos faz sentido no roadmap.',
        patienceDelta: 14,
        mood: 'interested',
        dealOfferedTemplate: 'Parceria tecnológica com aporte de $300.000 em troca de 5% de equity simbólico e exclusividade de API.',
        consequence: { cashDelta: 300000, equityTaken: 5 },
      },
      {
        id: 'nuverde_equity_2',
        texto: 'Não queremos assento político no board para burocratizar suas decisões, mas ter participação acionária alinha nossos interesses de longo prazo.',
        patienceDelta: 11,
        mood: 'neutral',
      },
      {
        id: 'nuverde_equity_3',
        texto: 'Oferecer ações antes de limpar o passivo contábil deixado pela gestão anterior é prematuro. Prefiro falar de contrato de software.',
        patienceDelta: 4,
        mood: 'skeptical',
      },
    ],
    blefe: [
      {
        id: 'nuverde_bluff_1',
        texto: 'Dizer que tem outros parceiros sem demonstrar métricas técnicas? A comunidade tech é pequena, {nomeJogador}. Sei exatamente quem procurou quem essa semana.',
        patienceDelta: -14,
        mood: 'skeptical',
      },
      {
        id: 'nuverde_bluff_2',
        texto: 'Blefar sobre fundos soberanos soa muito antiquado para quem comanda uma empresa de tecnologia. Traga commits no GitHub e telemetria real.',
        patienceDelta: -12,
        mood: 'skeptical',
      },
      {
        id: 'nuverde_bluff_3',
        texto: 'Transparência radical é inegociável para a NuVerde. Quando você inventa propostas imaginárias, destrói nossa confiança mútua.',
        patienceDelta: -15,
        mood: 'furious',
      },
    ],
    bajulacao: [
      {
        id: 'nuverde_flatter_1',
        texto: 'Fico feliz que você valorize nossa cultura ágil e sustentável! É revigorante ver fundadores que entendem o futuro da economia verde.',
        patienceDelta: 10,
        mood: 'interested',
      },
      {
        id: 'nuverde_flatter_2',
        texto: 'Obrigada pelas gentis palavras, CEO. Mas o mérito real é do nosso time de engenharia de software distribuído.',
        patienceDelta: 7,
        mood: 'neutral',
      },
      {
        id: 'nuverde_flatter_3',
        texto: 'Agradeço o apreço pela marca NuVerde, mas vamos manter o foco na integração técnica da {empresa}.',
        patienceDelta: 4,
        mood: 'neutral',
      },
    ],
    humildade: [
      {
        id: 'nuverde_humble_1',
        texto: 'Admitir abertamente as falhas de governança herdadas de Arthur Vance mostra coragem moral rara no mercado. Estou disposta a acelerar o comitê de crédito por você.',
        patienceDelta: 15,
        mood: 'convinced',
        dealOfferedTemplate: 'Desconto de 40% nas tarifas de processamento e fôlego de 60 dias para amortização de passivo.',
        consequence: { debtDaysExtension: 60, reputationDelta: 5 },
      },
      {
        id: 'nuverde_humble_2',
        texto: 'Erros do passado não definem o futuro de uma startup se a liderança atual for humilde para corrigir o curso. Conte comigo.',
        patienceDelta: 12,
        mood: 'interested',
      },
      {
        id: 'nuverde_humble_3',
        texto: 'Pedir desculpas aos clientes lesados foi o movimento correto. Agora precisamos de código estável rodando em produção.',
        patienceDelta: 8,
        mood: 'neutral',
      },
    ],
    indiferenca: [
      {
        id: 'nuverde_indiff_1',
        texto: 'Mensagens vazias não combinam com a cultura ágil da NuVerde. Se você não tem uma proposta estruturada, prefiro liberar o slot na minha agenda.',
        patienceDelta: -10,
        mood: 'skeptical',
      },
      {
        id: 'nuverde_indiff_2',
        texto: 'Esperava mais energia inovadora e propositiva do novo líder da {empresa}. Estamos perdendo tempo aqui.',
        patienceDelta: -8,
        mood: 'skeptical',
      },
    ],
    repeticao: [
      {
        id: 'nuverde_repeat',
        texto: 'Você acabou de repetir o mesmo argumento na rodada anterior, {nomeJogador}. Iteração rápida exige novas hipóteses e flexibilidade. O que mais você tem?',
        patienceDelta: -14,
        mood: 'furious',
      },
    ],
  },

  // 4. Zack Meta - Metaphase Corp (Big Tech analítica, realidade virtual & IA)
  metaphase_zack: {
    dados_financeiros: [
      {
        id: 'zack_data_1',
        texto: 'Interessante. Se os servidores da {empresa} processam esse volume de {valor}, podemos integrar seus fluxos aos nossos modelos neurais imersivos.',
        patienceDelta: 15,
        mood: 'interested',
        dealOfferedTemplate: 'Contrato de telemetria e licença de IA de {valor} com adiantamento à vista.',
        consequence: { cashDelta: 750000 },
      },
      {
        id: 'zack_data_2',
        texto: 'Seus dados de retenção diária importam mais do que a contabilidade tradicional. Apresente os logs de latência que liberamos capital de P&D.',
        patienceDelta: 12,
        mood: 'neutral',
      },
      {
        id: 'zack_data_3',
        texto: '{valor} em moedas fiduciárias é ruído temporário. O que a Metaphase valoriza são gigabytes de interação humana por segundo.',
        patienceDelta: 4,
        mood: 'neutral',
      },
      {
        id: 'zack_data_no_val_1',
        texto: 'Métricas de engajamento são a única métrica que importa para o futuro da fusão neural. Gostei da direção técnica da sua resposta.',
        patienceDelta: 8,
        mood: 'interested',
      },
    ],
    ameaca: [
      {
        id: 'zack_threat_1',
        texto: 'Ameaçar a Metaphase? Temos 3 bilhões de avatares conectados e mais advogados de regulação internacional do que habitantes na sua cidade natal. Seu argumento é estatisticamente irrelevante.',
        patienceDelta: -25,
        mood: 'furious',
      },
      {
        id: 'zack_threat_2',
        texto: 'Qualquer tentativa de processo ou chantagem midiática contra nossa plataforma será neutralizada pelo algoritmo antes de virar trending topic.',
        patienceDelta: -20,
        mood: 'skeptical',
      },
      {
        id: 'zack_threat_3',
        texto: 'Hostilidade detectada. Nossa equipe de hackathons internos pode duplicar o software da {empresa} em 72 horas se você cruzar a linha.',
        patienceDelta: -22,
        mood: 'furious',
      },
    ],
    oferta_equity: [
      {
        id: 'zack_equity_1',
        texto: 'Equity em hardware ou software legado não nos seduz. Mas se vier com exclusividade nos drivers da Vantex para nossa plataforma de realidade mista, eu assino o termo.',
        patienceDelta: 14,
        mood: 'interested',
        dealOfferedTemplate: 'Subsídio de P&D de $600.000 em troca de 10% de equity e exclusividade em realidade mista.',
        consequence: { cashDelta: 600000, equityTaken: 10 },
      },
      {
        id: 'zack_equity_2',
        texto: 'Ações preferenciais na {empresa} servem para calibrar o alinhamento de interesses entre nossos ecossistemas digitais.',
        patienceDelta: 10,
        mood: 'neutral',
      },
      {
        id: 'zack_equity_3',
        texto: 'Não queremos diluição burocrática. Queremos absorver seu time de visão computacional.',
        patienceDelta: 2,
        mood: 'skeptical',
      },
    ],
    blefe: [
      {
        id: 'zack_bluff_1',
        texto: 'Nossos modelos de inferência comportamental identificaram 94.7% de probabilidade de blefe na sua afirmação sobre outros concorrentes.',
        patienceDelta: -16,
        mood: 'skeptical',
      },
      {
        id: 'zack_bluff_2',
        texto: 'Você está tentando aplicar táticas de psicologia humana analógica contra uma big tech orientada a clusters de GPU. Não funciona, {nomeJogador}.',
        patienceDelta: -15,
        mood: 'skeptical',
      },
      {
        id: 'zack_bluff_3',
        texto: 'Afirmações grandiosas sem telemetria verificável serão descartadas como ruído de treino.',
        patienceDelta: -12,
        mood: 'neutral',
      },
    ],
    bajulacao: [
      {
        id: 'zack_flatter_1',
        texto: 'Elogiar nossa infraestrutura neural é um fato empírico mensurável, não uma cortesia. Prossiga para a proposta prática.',
        patienceDelta: 4,
        mood: 'neutral',
      },
      {
        id: 'zack_flatter_2',
        texto: 'Agradeço o reconhecimento da nossa superioridade em escala de dados. Agora mostre como a {empresa} se encaixa no nosso metaverso.',
        patienceDelta: 6,
        mood: 'neutral',
      },
      {
        id: 'zack_flatter_3',
        texto: 'Adulação não altera minha função de utilidade nesta negociação.',
        patienceDelta: 0,
        mood: 'neutral',
      },
    ],
    humildade: [
      {
        id: 'zack_humble_1',
        texto: 'Reconhecer que sistemas com falhas contábeis precisam de refatoração estrutural é racional. A Metaphase valoriza pragmatismo sobre orgulho.',
        patienceDelta: 11,
        mood: 'interested',
      },
      {
        id: 'zack_humble_2',
        texto: 'Desculpas são apenas uma transição de estado. O que importa é a taxa de erro nos seus próximos patches de entrega.',
        patienceDelta: 7,
        mood: 'neutral',
      },
      {
        id: 'zack_humble_3',
        texto: 'Entendido seu contexto de crise. Se vocês resolverem os bugs de governança, o tráfego da Metaphase pode salvar a {empresa}.',
        patienceDelta: 9,
        mood: 'interested',
      },
    ],
    indiferenca: [
      {
        id: 'zack_indiff_1',
        texto: 'Mensagem com densidade de informação nula. Estou redirecionando 90% da minha atenção de processamento para outra chamada.',
        patienceDelta: -12,
        mood: 'skeptical',
      },
      {
        id: 'zack_indiff_2',
        texto: 'Sem dados objetivos na tela, esta reunião é um desperdício de watts de energia.',
        patienceDelta: -10,
        mood: 'skeptical',
      },
    ],
    repeticao: [
      {
        id: 'zack_repeat',
        texto: 'Loop detectado. Você inseriu exatamente a mesma premissa da rodada anterior. Como qualquer sistema computacional eficiente, rejeito redundâncias estéreis.',
        patienceDelta: -16,
        mood: 'furious',
      },
    ],
  },

  // 5. Interlocutor Corporativo Genérico (Fallback robusto)
  generic: {
    dados_financeiros: [
      {
        id: 'gen_data_1',
        texto: 'Os números apresentados de {valor} mostram que a nova diretoria tem controle das planilhas. Podemos avançar para um memorando de entendimento com prazos definidos.',
        patienceDelta: 12,
        mood: 'interested',
        dealOfferedTemplate: 'Memorando comercial de cooperação com adiantamento contratual de {valor}.',
        consequence: { debtDaysExtension: 30 },
      },
      {
        id: 'gen_data_2',
        texto: 'Bons dados, {nomeJogador}. Se você demonstrar que a {empresa} honrará esse compromisso, temos acordo preliminar.',
        patienceDelta: 10,
        mood: 'convinced',
      },
      {
        id: 'gen_data_no_val_1',
        texto: 'Projeções sérias de faturamento são essenciais depois do histórico recente. Vamos detalhar as garantias reais.',
        patienceDelta: 8,
        mood: 'neutral',
      },
    ],
    ameaca: [
      {
        id: 'gen_threat_1',
        texto: 'Essa agressividade só comprova fragilidade executiva. Meus advogados não respondem a intimidações de devedores em apuros.',
        patienceDelta: -20,
        mood: 'furious',
      },
      {
        id: 'gen_threat_2',
        texto: 'Tentar nos pressionar com tribunais ou imprensa só fechará as portas do mercado para a {empresa}. Modere seu tom.',
        patienceDelta: -18,
        mood: 'skeptical',
      },
    ],
    oferta_equity: [
      {
        id: 'gen_equity_1',
        texto: 'Participação acionária é uma proposta tentadora para alinhar nossos ganhos futuros, desde que a governança seja restaurada.',
        patienceDelta: 12,
        mood: 'interested',
        dealOfferedTemplate: 'Entrada como sócio estratégico mediante 10% de participação e alívio financeiro imediato.',
        consequence: { equityTaken: 10 },
      },
      {
        id: 'gen_equity_2',
        texto: 'Podemos aceitar assento no conselho e debêntures conversíveis em troca de estender seus prazos de liquidação.',
        patienceDelta: 10,
        mood: 'neutral',
      },
    ],
    blefe: [
      {
        id: 'gen_bluff_1',
        texto: 'Afirmar que possui outra proposta milionária sem nenhum comprovante oficial parece um blefe ingênuo, {nomeJogador}.',
        patienceDelta: -14,
        mood: 'skeptical',
      },
      {
        id: 'gen_bluff_2',
        texto: 'No mundo dos negócios, papéis assinados falam mais alto do que promessas de terceiros imaginários.',
        patienceDelta: -12,
        mood: 'neutral',
      },
    ],
    bajulacao: [
      {
        id: 'gen_flatter_1',
        texto: 'Agradeço as gentilezas, CEO. Mas o que tranquiliza nossa diretoria são termos objetivos e garantias bancárias sólidas.',
        patienceDelta: 4,
        mood: 'neutral',
      },
      {
        id: 'gen_flatter_2',
        texto: 'Cortesia sempre ajuda em mesas de negociação, mas vamos direto aos prazos da {empresa}.',
        patienceDelta: 3,
        mood: 'neutral',
      },
    ],
    humildade: [
      {
        id: 'gen_humble_1',
        texto: 'Assumir a responsabilidade e pedir paciência é um sinal de maturidade executiva. Estamos abertos a reestruturar o cronograma.',
        patienceDelta: 11,
        mood: 'interested',
        dealOfferedTemplate: 'Suspensão temporária de sanções mediante confissão de débito e novo cronograma.',
        consequence: { debtDaysExtension: 45 },
      },
      {
        id: 'gen_humble_2',
        texto: 'Compreendemos as dificuldades da transição pós-fraude. Se houver boa-fé mútua, chegaremos a um consenso.',
        patienceDelta: 9,
        mood: 'neutral',
      },
    ],
    indiferenca: [
      {
        id: 'gen_indiff_1',
        texto: 'Palavras vagas não resolvem o impasse. Preciso de uma proposta concreta para levar aos meus superiores.',
        patienceDelta: -8,
        mood: 'skeptical',
      },
      {
        id: 'gen_indiff_2',
        texto: 'Se a {empresa} não tem nada substancial a ofertar, esta reunião não tem razão para continuar.',
        patienceDelta: -10,
        mood: 'skeptical',
      },
    ],
    repeticao: [
      {
        id: 'gen_repeat',
        texto: 'Você já tentou esse argumento, CEO {nomeJogador}. Traga algo novo para podermos avançar nesta mesa.',
        patienceDelta: -12,
        mood: 'furious',
      },
    ],
  },
};

// Armazenamento em memória do histórico de cada personagem por sessão/execução
export const HISTORICO_PERSONAGENS: Record<string, HistoricoNegociacao> = {};

/**
 * Retorna o histórico de negociação de um personagem específico
 */
export function getHistoricoPersonagem(charId: string): HistoricoNegociacao {
  if (!HISTORICO_PERSONAGENS[charId]) {
    HISTORICO_PERSONAGENS[charId] = {
      ultimasCategorias: [],
      ultimoTemplateId: null,
    };
  }
  return HISTORICO_PERSONAGENS[charId];
}

/**
 * 3 & 4. MOTOR PRINCIPAL DE NEGOCIAÇÃO PROCEDURAL LOCAL (ZERO API)
 */
export function executarNegociacaoLocal(params: {
  character: any;
  playerMessage: string;
  tactic?: string;
  gameState?: any;
}) {
  const { character, playerMessage, gameState } = params;
  const charId = character?.id || 'generic';
  const charPool = RESPOSTAS[charId] || RESPOSTAS.generic;
  const historico = getHistoricoPersonagem(charId);

  // 1. Análise de intenção da mensagem
  const analise = analisarMensagem(playerMessage || '');

  // 2. Determinação da categoria prioritária
  let categoriaEscolhida = 'indiferenca';
  for (const catPrioritaria of ORDEM_PRIORIDADE) {
    if (analise.categorias.includes(catPrioritaria)) {
      categoriaEscolhida = catPrioritaria;
      break;
    }
  }

  // 3. Verificação de repetição imediata (Anti-repetição)
  const isRepeticao = historico.ultimasCategorias.length > 0 &&
    historico.ultimasCategorias[0] === categoriaEscolhida;

  let templateEscolhido: RespostaTemplate;

  if (isRepeticao && charPool.repeticao && charPool.repeticao.length > 0) {
    // Template especial de repetição com penalidade de paciência extra de -10
    const repBase = charPool.repeticao[0];
    templateEscolhido = {
      ...repBase,
      patienceDelta: repBase.patienceDelta - 10,
    };
  } else {
    // Busca os templates da categoria selecionada (ou fallback para indiferenca/dados)
    const templatesPossiveis = charPool[categoriaEscolhida] || charPool.indiferenca || charPool.dados_financeiros || [];

    // Exclui o template usado na última rodada se houver outras opções
    let candidatos = templatesPossiveis.filter(t => t.id !== historico.ultimoTemplateId);
    if (candidatos.length === 0) {
      candidatos = templatesPossiveis;
    }

    // Se tiver valor mencionado, prioriza templates que contêm "{valor}"
    if (analise.valorMencionado !== null) {
      const comValor = candidatos.filter(t => t.texto.includes('{valor}'));
      if (comValor.length > 0) {
        candidatos = comValor;
      }
    } else {
      // Se não tiver valor, prefere templates sem "{valor}"
      const semValor = candidatos.filter(t => !t.texto.includes('{valor}'));
      if (semValor.length > 0) {
        candidatos = semValor;
      }
    }

    // Seleção pseudo-aleatória
    const index = Math.floor(Math.random() * candidatos.length);
    templateEscolhido = candidatos[index] || {
      id: 'fallback_default',
      texto: 'Compreendo seus argumentos, {nomeJogador}. Mas diante da fragilidade da {empresa}, precisamos de garantias mais robustas.',
      patienceDelta: 0,
      mood: 'neutral',
    };
  }

  // 4. Preenchimento de slots/placeholders
  const ctx = {
    valor: analise.valorMencionado,
    empresa: 'Vantex Dynamics',
    nomeJogador: gameState?.ceoName || 'CEO',
    paciencia: character?.currentPatience ?? character?.patience ?? 50,
  };

  const reply = preencherTemplate(templateEscolhido.texto, ctx);
  const dealOffered = templateEscolhido.dealOfferedTemplate
    ? preencherTemplate(templateEscolhido.dealOfferedTemplate, ctx)
    : null;

  // 5. Aplicação da penalidade de agressividade extra ao patienceDelta
  // Se houver agressividade extra (>0), ela soma ao delta negativo ou reduz o delta positivo
  let patienceDeltaFinal = templateEscolhido.patienceDelta - analise.agressividadeExtra;

  // Atualização do histórico do personagem
  historico.ultimasCategorias = [categoriaEscolhida, ...historico.ultimasCategorias].slice(0, 2);
  historico.ultimoTemplateId = templateEscolhido.id;

  // 6. Consequências e limite de paciência (Walkout)
  const currentPatience = ctx.paciencia;
  const resultingPatience = currentPatience + patienceDeltaFinal;

  let mood = templateEscolhido.mood;
  let dealStatus: 'talking' | 'accepted' | 'rejected' | 'walkout' = 'talking';

  if (dealOffered && patienceDeltaFinal > 8 && resultingPatience >= 50) {
    dealStatus = 'talking'; // Proposta na mesa
  }

  let finalReply = reply;
  if (resultingPatience <= 10) {
    mood = 'furious';
    dealStatus = 'walkout';
    finalReply += ' Esta reunião está definitivamente encerrada. Não nos procure mais sem ordem judicial!';
  }

  const consequence = {
    cashDelta: templateEscolhido.consequence?.cashDelta || 0,
    debtDelta: templateEscolhido.consequence?.debtDelta || 0,
    debtDaysExtension: templateEscolhido.consequence?.debtDaysExtension || 0,
    equityTaken: templateEscolhido.consequence?.equityTaken || 0,
    reputationDelta: templateEscolhido.consequence?.reputationDelta || (patienceDeltaFinal > 10 ? 3 : patienceDeltaFinal < -15 ? -5 : 0),
  };

  return {
    reply: finalReply,
    patienceDelta: patienceDeltaFinal,
    mood,
    dealOffered,
    dealStatus,
    consequence,
    analise,
  };
}
