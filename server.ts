import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { launchProduct, ProductLaunchInput, CATEGORY_BASELINE } from "./productSystem";
import { validarNumero } from "./src/utils/validation";
import { GameState, NegotiationCharacter, NewsArticle } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Rate limiting for AI endpoints
const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: "Muitas requisições. Por favor, aguarde 10 minutos antes de tentar novamente." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Allowed domains for CORS (dynamic fallback to generic for AI Studio, but strictly custom domain in prod)
const allowedOrigins = process.env.ALLOWED_ORIGIN 
  ? [process.env.ALLOWED_ORIGIN] 
  : ['http://localhost:3000', 'https://ais-dev-vihl7zglyixhqnjmjh2t6m-349503882336.us-east1.run.app', 'https://ais-pre-vihl7zglyixhqnjmjh2t6m-349503882336.us-east1.run.app'];

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-App-Origin"]
}));

// Basic App-Origin verification middleware to block simple direct automated scripts
app.use('/api', (req, res, next) => {
  // Allow healthcheck
  if (req.path === '/health') return next();
  
  const appOrigin = req.headers['x-app-origin'];
  if (appOrigin !== 'ceo-empire-client-v1') {
    return res.status(403).json({ error: "Acesso direto à API bloqueado. Cabeçalho de cliente ausente ou inválido." });
  }
  next();
});

app.use(express.json());

// Log temporário para validar se a env var está sendo lida na Vercel
console.log("[CEO Empire API] GEMINI_API_KEY configurada?", !!process.env.GEMINI_API_KEY);

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Dynamic AI Negotiation Endpoint
app.post("/api/negotiate", aiRateLimiter, async (req: Request, res: Response) => {
  const {
    character,
    history,
    playerMessage,
    tactic,
    gameState,
  } = req.body;

  const charName = character?.name || "Interlocutor Corporativo";
  const charTitle = character?.title || "Executivo";
  const charCompany = character?.company || "Empresa";
  const personality = character?.personality || "Exigente e desconfiado.";
  const currentPatience = validarNumero(character?.startingPatience, 60);
  const currentMood = character?.mood || "cautious";

  const validCash = validarNumero(gameState?.cash, 100000);
  const validDebt = validarNumero(gameState?.debt, 500000);
  const validDebtDeadlineDays = validarNumero(gameState?.debtDeadlineDays, 90);
  const validRepPublic = validarNumero(gameState?.reputation?.public, 50);
  const validRepInvestors = validarNumero(gameState?.reputation?.investors, 40);

  const ai = getAI();

  if (ai) {
    try {
      const systemInstruction = `Você é ${charName}, ${charTitle} da ${charCompany} no universo satírico/dramático de negócios do jogo 'CEO Empire' (estilo Succession + Game Dev Tycoon).
Sua personalidade: ${personality}
O jogador é o novo CEO da Vantex Dynamics, empresa em crise com histórico de fraude pelo ex-CEO foragido Arthur Vance.
Dados da empresa do jogador:
- Caixa: $${validCash.toLocaleString()}
- Dívida ativa: $${validDebt.toLocaleString()}
- Dias restantes para vencer a dívida: ${validDebtDeadlineDays} dias
- Era atual: ${gameState?.era || "Startup Garagem"}
- Reputação pública: ${validRepPublic}/100
- Confiança do mercado: ${validRepInvestors}/100
- Paciência atual com o jogador: ${currentPatience}/100

Regras da Negociação:
1. Responda em português (PT-BR) de forma viva, ácida, corporativa, com sarcasmo ou respeito merecido.
2. Reaja diretamente ao tom do jogador e à tática usada: "${tactic || "normal"}". Se for blefe sem respaldo, desconfie; se trouxer números concretos ou equity atraente, considere.
3. Determine se a paciência sobe (+5 a +15 se agradar) ou desce (-10 a -30 se irritar/blefar mal).
4. Se o acordo for vantajoso ou o jogador foi convincente, faça uma proposta concreta de acordo ("dealOffered") ou marque "dealStatus" como "accepted".
5. Se a paciência chegar a 0, encerre a reunião ("walkout").
6. IMPORTANTE: Retorne ESTRITAMENTE um JSON válido com o seguinte schema:
{
  "reply": "string (sua fala direta para o CEO)",
  "patienceDelta": number (-30 a +20),
  "mood": "furious" | "skeptical" | "neutral" | "interested" | "convinced",
  "dealOffered": "string com termos específicos do contrato ou null se ainda negociando",
  "dealStatus": "talking" | "accepted" | "rejected" | "walkout",
  "consequence": {
    "cashDelta": number (se houver injeção ou pagamento imediato, senão 0),
    "debtDelta": number (se houver redução ou perdão de dívida, senão 0),
    "debtDaysExtension": number (se for o banco concedendo prazo, senão 0),
    "equityTaken": number (se for investidor pegando %, senão 0),
    "reputationDelta": number (-10 a +15)
  }
}`;

      const conversationHistoryText = (history || [])
        .map((h: { sender: string; text: string }) => `${h.sender === "player" ? "CEO (Jogador)" : charName}: ${h.text}`)
        .join("\n");

      const prompt = `Histórico da reunião até agora:
${conversationHistoryText}

Nova fala do CEO (Jogador): "${playerMessage}"
Tática declarada pelo jogador: ${tactic || "argumento direto"}

Analise profundamente o que o jogador disse: identifique se há blefe, ameaça, bajulação, apelo a dados, proposta financeira específica ou agressividade. Reaja de acordo com seu personagem corporativo com total realismo e sarcasmo de alta executiva/executivo.
Gere sua resposta e a avaliação da negociação no formato JSON especificado.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json({ success: true, aiGenerated: true, ...parsed });
    } catch (err: unknown) {
      console.warn("Gemini API call failed, falling back to simulated negotiation logic:", err);
      // Fallback below
    }
  }

  // Realistic Procedural Fallback Engine (runs when no key or during fallback)
  const simulated = generateSimulatedNegotiation(character, playerMessage, tactic, gameState);
  return res.json({ success: true, aiGenerated: false, ...simulated });
});

// Procedural fallback logic for seamless experience
function generateSimulatedNegotiation(
  character: NegotiationCharacter,
  playerMessage: string,
  tactic: string,
  gameState: GameState
) {
  const msgLower = (playerMessage || "").toLowerCase();
  const id = character?.id || "confianca";
  let patienceDelta = -5;
  let mood = "skeptical";
  let reply = "";
  let dealOffered: string | null = null;
  let dealStatus = "talking";
  let consequence = {
    cashDelta: 0,
    debtDelta: 0,
    debtDaysExtension: 0,
    equityTaken: 0,
    reputationDelta: 0,
  };

  const currentPatience = character?.startingPatience ?? 50;

  if (id === "confianca_barreto") {
    // Dr. Osvaldo Barreto - Confiança Federal
    if (tactic === "threat") {
      patienceDelta = -25;
      mood = "furious";
      reply = "Você ousa me ameaçar no meu próprio gabinete? O Confiança Federal financiou governos antes de você aprender a usar uma planilha. A liquidação da Vantex está a um carimbo de distância!";
    } else if (tactic === "data" || msgLower.includes("números") || msgLower.includes("receita") || msgLower.includes("plano")) {
      patienceDelta = +12;
      mood = "interested";
      reply = "Hmm... Esses demonstrativos mostram que você estancou a sangria deixada pelo Arthur Vance. Não vou perdoar a dívida de $500k, mas se você depositar $100k de entrada, eu concedo mais 60 dias de prazo.";
      dealOffered = "Extensão de 60 dias da dívida por pagamento de $100k à vista.";
      dealStatus = "talking";
    } else if (tactic === "bluff") {
      if (Math.random() > 0.5) {
        patienceDelta = -20;
        mood = "skeptical";
        reply = "Esse papo furado de 'aporte iminente de fundo soberano' não cola comigo. Arthur Vance usava as mesmas palavras exatas antes de sumir com o helicóptero da empresa.";
      } else {
        patienceDelta = +5;
        mood = "neutral";
        reply = "Se você realmente tem outro credor querendo comprar essa dívida podre, traga o comprovante assinado amanhã. Caso contrário, o prazo continua correndo.";
      }
    } else if (tactic === "equity") {
      patienceDelta = +15;
      mood = "convinced";
      reply = "O banco normalmente não aceita equity podre, mas a divisão de venture capital aceitaria 8% da Vantex para estender seu prazo em 90 dias e suspender as custas judiciais.";
      dealOffered = "Extensão de 90 dias sem juros em troca de 8% de participação acionária.";
      dealStatus = "talking";
    } else {
      patienceDelta = -2;
      mood = "neutral";
      reply = "Palavras bonitas não pagam boletos bancários, CEO. Faltam poucos dias para a execução da hipoteca dos servidores da Vantex. O que você tem de concreto?";
    }
  } else if (id === "rockridge_stone") {
    // Gordon Stone - RockRidge Capital (Vulture fund)
    if (tactic === "threat") {
      patienceDelta = -15;
      mood = "furious";
      reply = "Ameaças são munição de quem não tem capital. Nós compramos debêntures distressed no almoço e vendemos carcaças no jantar. Fale o preço ou saia da sala.";
    } else if (tactic === "equity" || msgLower.includes("investimento") || msgLower.includes("aporte")) {
      patienceDelta = +18;
      mood = "convinced";
      reply = "Agora você está falando a minha língua. Colocamos $1.500.000 em caixa agora mesmo. Em troca, queremos 25% de equity da Vantex e duas cadeiras no Conselho de Administração.";
      dealOffered = "Injeção de $1.500.000 em troca de 25% de equity e controle consultivo.";
      dealStatus = "talking";
    } else if (tactic === "data") {
      patienceDelta = +10;
      mood = "interested";
      reply = "Sua margem bruta prevista é interessante. Se você comprovar 40% de retenção no próximo trimestre, lideramos uma rodada Series A de até $3 milhões.";
      dealOffered = "Compromisso de Series A de $3M condicionado a metas de retenção.";
    } else {
      patienceDelta = -8;
      mood = "skeptical";
      reply = "Tempo é o único ativo não renovável, CEO. A cada minuto que você hesita, o valuation da Vantex cai 2%. Qual é a sua proposta objetiva?";
    }
  } else if (id === "nuverde_lins") {
    // Camila Lins - NuVerde Fintech
    if (tactic === "data" || tactic === "charm") {
      patienceDelta = +15;
      mood = "convinced";
      reply = "Adorei a visão! Na NuVerde nós odiamos a burocracia dos bancões velhos como o Confiança Federal. Podemos abrir uma linha de crédito rotativo de $400k com taxas 60% menores para você quitar o passivo.";
      dealOffered = "Linha de Crédito NuVerde de $400k a 1.2% a.m. para refinanciar o passivo.";
      dealStatus = "talking";
    } else if (tactic === "threat") {
      patienceDelta = -20;
      mood = "skeptical";
      reply = "Postura corporativa antiquada e tóxica. Nossa cultura valoriza transparência e dados, não bravatas de Wall Street dos anos 80.";
    } else {
      patienceDelta = +5;
      mood = "neutral";
      reply = "A proposta da Vantex Core para nossa infraestrutura de pagamentos tem fit. Se seus testes de estresse aguentarem 50 mil requisições por segundo, fechamos a parceria.";
      dealOffered = "Contrato de fornecimento de software de $350k/ano.";
    }
  } else if (id === "metaphase_zack") {
    // Zack Meta - Metaphase
    if (msgLower.includes("dados") || msgLower.includes("usuários") || msgLower.includes("ia") || tactic === "data") {
      patienceDelta = +15;
      mood = "interested";
      reply = "A Metaphase precisa de telemetria contínua para alimentar nosso modelo de realidade sintética. Se você nos conceder acesso prioritário às APIs da Vantex, adiantamos $800.000 em patrocínio de P&D.";
      dealOffered = "Parceria de Dados de $800k em troca de integração prioritária com o metaverso.";
    } else if (tactic === "threat") {
      patienceDelta = -25;
      mood = "furious";
      reply = "Você acha que pode rivalizar com nossos 3 bilhões de usuários ativos diários? Nós podemos clonar seu produto em um fim de semana num hackathon interno.";
    } else {
      patienceDelta = +2;
      mood = "neutral";
      reply = "O futuro é a fusão neural e os avatares imersivos. A Vantex quer fazer parte da revolução ou ser varrida pela história?";
    }
  } else {
    // Generic corporate interlocutor
    if (tactic === "data") {
      patienceDelta = +10;
      mood = "interested";
      reply = "Os indicadores que você apresentou são plausíveis. Podemos estruturar um memorando de entendimento com cláusulas de desempenho.";
      dealOffered = "Acordo comercial preliminar com adiantamento de $250.000.";
    } else if (tactic === "threat") {
      patienceDelta = -20;
      mood = "skeptical";
      reply = "Essa agressividade só demonstra desespero financeiro. Meus advogados não respondem a blefes.";
    } else {
      patienceDelta = +3;
      mood = "neutral";
      reply = "Entendo seu ponto de vista. Porém, diante do escândalo recente da Vantex, o risco reputacional precisa ser compensado financeiramente.";
    }
  }

  // Handle patience boundary
  if (currentPatience + patienceDelta <= 10) {
    mood = "furious";
    dealStatus = "walkout";
    reply += " Esta reunião está encerrada. Não nos procure mais sem garantias judiciais.";
  }

  return {
    reply,
    patienceDelta,
    mood,
    dealOffered,
    dealStatus,
    consequence,
  };
}

// Generate dynamic satirical TechPulse News
app.post("/api/generate-news", aiRateLimiter, async (req: Request, res: Response) => {
  const { eventType, eventDetails, gameState } = req.body;
  
  const validEra = gameState?.era || "Startup Garagem";

  const ai = getAI();

  if (ai) {
    try {
      const prompt = `Gere uma manchete e parágrafo satírico curto (máximo 40 palavras) para o jornal fictício "TechPulse News" ou "Wall Street Dispatch" reagindo ao evento: "${eventType}: ${eventDetails}".
Empresa do jogador: Vantex Dynamics (CEO novo após fraude contábil). Era: ${validEra}.
Tom: ácido, bem-humorado, cínico, estilo Bloomberg / TechCrunch / Succession.
Formato JSON:
{
  "title": "Manchete impactante com humor ácido",
  "snippet": "Texto da notícia satírica",
  "sentiment": "bullish" | "bearish" | "neutral"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, news: parsed });
    } catch (e) {
      console.warn("Failed AI news generation, returning default:", e);
    }
  }

  // Fallback news
  res.json({
    success: true,
    news: {
      title: `Vantex Dynamics movimenta o mercado com decisão sobre ${eventType}`,
      snippet: `Analistas da Faria Lima e do Vale do Silício continuam céticos, mas as ações reagiram ao rumor com a habitual volatilidade de cassino.`,
      sentiment: "neutral",
    },
  });
});

// Full Product Launch Engine Endpoint
app.post("/api/launch-product", aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const input: ProductLaunchInput = req.body.input;
    const competidores = req.body.competidores || [];
    const reputacao = req.body.reputacao || req.body.gameState?.reputation || {
      public: 50,
      investors: 50,
      customers: 50,
      employees: 50,
    };

    if (!input || !input.name || !input.category) {
      return res.status(400).json({ success: false, error: "Dados inválidos de lançamento de produto." });
    }

    // Validate inputs
    input.marketingBudget = validarNumero(input.marketingBudget, 5000);
    input.unitPrice = validarNumero(input.unitPrice, 100);

    const result = launchProduct(input, competidores, reputacao);

    // AI Satirical News Generation for this product launch
    let generatedNews: NewsArticle | null = null;
    const ai = getAI();
    if (ai) {
      try {
        const prompt = `Gere uma notícia satírica (máximo 45 palavras) para o jornal tech "TechPulse News" ou "Wall Street Journal" cobrindo o lançamento de produto:
Produto: ${result.name}
Categoria: ${CATEGORY_BASELINE[result.category]?.name || result.category}
Segmento: ${result.segment}
Nota da Crítica: ${result.reviewScore}/100 (${result.reviewVerdict})
Vendas: ${result.unidadesVendidas.toLocaleString()} unidades
Lucro: $${result.lucro.toLocaleString()}
Teve Recall: ${result.teveRecall ? `SIM, motivo: ${result.recallReason}` : 'Não, lançamento regular'}
Empresa: Vantex Dynamics (CEO novo reconstruindo após escândalo contábil).
Tom: Ácido, irônico, afiado, estilo Succession / Bloomberg / Silicon Valley.
Formato JSON:
{
  "title": "Manchete impactante com humor ácido",
  "snippet": "Texto curto da notícia satírica",
  "sentiment": "${result.eventoDeMercado.sentiment}"
}`;

        const newsResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });

        generatedNews = JSON.parse(newsResponse.text || "{}");
      } catch (newsErr) {
        console.warn("AI product news generation failed, using procedural fallback:", newsErr);
      }
    }

    if (!generatedNews) {
      generatedNews = {
        id: `news_launch_${Date.now()}`,
        day: 1,
        quarter: 1,
        source: 'Mercado Tech',
        title: result.teveRecall
          ? `VEXAME: Vantex convoca recall urgente para ${result.name} após falha grave`
          : result.reviewScore >= 85
          ? `Frenesi em Wall Street: ${result.name} da Vantex bate recorde de vendas`
          : `Vantex lança ${result.name} com recepção mista de analistas`,
        snippet: result.teveRecall
          ? `Consumidores indignados e investidores em pânico após o fiasco: ${result.recallReason}`
          : `Com nota ${result.reviewScore}/100 e ${result.unidadesVendidas.toLocaleString()} unidades despachadas, o mercado tenta decifrar a estratégia do novo CEO.`,
        sentiment: result.eventoDeMercado.sentiment,
      };
    }

    return res.json({
      success: true,
      result,
      generatedNews,
    });
  } catch (err: unknown) {
    console.error("Error launching product in server:", err);
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CEO Empire server running on port ${PORT}`);
  });
}

// Em ambiente de produção na Vercel, o VERCEL="1" é injetado automaticamente
if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
