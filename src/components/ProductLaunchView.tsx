import React, { useState, useMemo } from 'react';
import {
  Rocket,
  Cpu,
  Smartphone,
  Gamepad2,
  Tablet,
  Watch,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Shuffle,
  Newspaper,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import { GameState } from '../types';
import {
  ProductCategory,
  TargetSegment,
  ProductSpecs,
  ProductLaunchInput,
  ProductLaunchResult,
  CATEGORY_BASELINE,
  calculateRdCost,
  calculateRecallRisk
} from '../utils/productSystem';
import { sounds } from '../utils/audio';

interface ProductLaunchViewProps {
  gameState: GameState;
  onUpdateGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onNavigateTab?: (tab: any) => void;
}

const RANDOM_NAMES: Record<ProductCategory, string[]> = {
  chip: ['Vantex Quantum-7', 'NeuralCore Ultra', 'HyperSilicon X1', 'TitanFabric AI', 'Vantex Synapse Pro'],
  smartphone: ['Vantex Horizon 16', 'Nova Prime X', 'Apex Fold Vision', 'Aether Phone Pro', 'Vantex Zero Max'],
  console: ['Vantex PlayStation X', 'NovaBox Ultra', 'CyberDeck Pro', 'Apex Gaming Rig', 'Vantex HoloConsole'],
  tablet: ['Vantex Canvas Studio', 'AetherPad Pro 13', 'NovaSlate Max', 'Apex Creator Tab', 'Vantex VisionPad'],
  smartwatch: ['Vantex Pulse Elite', 'ChronoSync Ultra', 'AetherBand Bio', 'Apex ChronoFit', 'Vantex Horizon Watch'],
};

export const ProductLaunchView: React.FC<ProductLaunchViewProps> = ({
  gameState,
  onUpdateGameState,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('smartphone');
  const [selectedSegment, setSelectedSegment] = useState<TargetSegment>('premium');
  const [productName, setProductName] = useState('Vantex Horizon 16');

  // Specs state (10 to 100)
  const [specs, setSpecs] = useState<ProductSpecs>({
    performance: 75,
    efficiency: 70,
    design: 80,
    software: 75,
  });

  // Prazo de desenvolvimento em dias
  const baseline = CATEGORY_BASELINE[selectedCategory];
  const [devDays, setDevDays] = useState<number>(baseline.recommendedDevDays);

  // Preço unitário e marketing
  const [unitPrice, setUnitPrice] = useState<number>(baseline.segmentPriceRange.premium.ideal);
  const [marketingBudget, setMarketingBudget] = useState<number>(35000);

  // Launch execution state
  const [isLaunching, setIsLaunching] = useState(false);
  const [lastLaunchResult, setLastLaunchResult] = useState<{
    result: ProductLaunchResult;
    news: any;
  } | null>(null);

  // Quando trocar de categoria, sincronizar presets recomendados
  const handleSelectCategory = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    const newBase = CATEGORY_BASELINE[cat];
    setDevDays(newBase.recommendedDevDays);
    setUnitPrice(newBase.segmentPriceRange[selectedSegment].ideal);
    const names = RANDOM_NAMES[cat];
    setProductName(names[Math.floor(Math.random() * names.length)]);
  };

  const handleSelectSegment = (seg: TargetSegment) => {
    setSelectedSegment(seg);
    const newBase = CATEGORY_BASELINE[selectedCategory];
    setUnitPrice(newBase.segmentPriceRange[seg].ideal);
  };

  const handleRandomizeName = () => {
    sounds.playClick();
    const names = RANDOM_NAMES[selectedCategory];
    const pick = names[Math.floor(Math.random() * names.length)];
    const suffix = Math.floor(Math.random() * 9 + 1);
    setProductName(`${pick} Gen ${suffix}`);
  };

  // Cálculos dinâmicos em tempo real
  const currentRdCost = useMemo(() => {
    return calculateRdCost(selectedCategory, specs);
  }, [selectedCategory, specs]);

  const currentRecallRisk = useMemo(() => {
    return calculateRecallRisk(selectedCategory, devDays, specs);
  }, [selectedCategory, devDays, specs]);

  const totalUpfrontCost = currentRdCost + marketingBudget;
  const canAfford = gameState.cash >= totalUpfrontCost;

  // Análise de preço vs segmento
  const priceTarget = baseline.segmentPriceRange[selectedSegment];
  const isOverpriced = unitPrice > priceTarget.max;
  const isUnderpriced = unitPrice < priceTarget.min;

  // Qualidade real estimada
  const estimatedQuality = Math.round(
    specs.performance * baseline.weights.performance +
    specs.efficiency * baseline.weights.efficiency +
    specs.design * baseline.weights.design +
    specs.software * baseline.weights.software
  );

  // Projeção estimada de hype
  const projectedHype = Math.min(
    100,
    Math.max(10, Math.round(Math.sqrt(marketingBudget / 500) * 11 + (gameState.reputation.public - 50) * 0.3 + (selectedSegment === 'ultra' ? 12 : 5)))
  );

  // Ação de Lançar Produto
  const handleLaunchProduct = async () => {
    if (!canAfford || isLaunching) return;

    sounds.playClick();
    setIsLaunching(true);

    const input: ProductLaunchInput = {
      name: productName.trim() || 'Vantex Tech Device',
      category: selectedCategory,
      segment: selectedSegment,
      specs,
      devDays,
      unitPrice,
      marketingBudget,
    };

    const competidores = Object.values(gameState.rivals || {});

    try {
      const response = await fetch('/api/launch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          competidores,
          reputacao: gameState.reputation,
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        const result: ProductLaunchResult = data.result;
        const generatedNews = data.generatedNews;

        if (result.teveRecall) {
          sounds.playWarningBeep();
        } else {
          sounds.playCashChime();
        }

        // Atualizar estado do jogo
        onUpdateGameState((prev) => {
          // Atualiza caixa com o lucro líquido final do lançamento
          const nextCash = Math.max(0, prev.cash + result.lucro);

          // Atualiza pilares de reputação
          const nextRep = {
            public: Math.min(100, Math.max(0, prev.reputation.public + result.reputacaoDelta.public)),
            investors: Math.min(100, Math.max(0, prev.reputation.investors + result.reputacaoDelta.investors)),
            customers: Math.min(100, Math.max(0, prev.reputation.customers + result.reputacaoDelta.customers)),
            employees: Math.min(100, Math.max(0, prev.reputation.employees + result.reputacaoDelta.employees)),
            esg: prev.reputation.esg,
          };

          // Impacto no preço das ações $VNTX
          const priceMultiplier = 1 + result.eventoDeMercado.impactoAcoes / 100;
          const nextStockPrice = Math.max(2.5, Number((prev.stockPrice * priceMultiplier).toFixed(2)));

          // Adiciona notícia gerada ao feed
          const newArticle = {
            id: `news_launch_${Date.now()}`,
            day: prev.day + Math.round(devDays / 2),
            quarter: prev.quarter,
            source: 'TechPulse News',
            title: generatedNews.title,
            snippet: generatedNews.snippet,
            fullContent: `${result.eventoDeMercado.detalhes} Análise de mercado indica sentimento ${generatedNews.sentiment}.`,
            sentiment: generatedNews.sentiment || result.eventoDeMercado.sentiment,
            category: 'vantex' as const,
            marketImpact: `${result.eventoDeMercado.impactoAcoes > 0 ? '+' : ''}${result.eventoDeMercado.impactoAcoes}% nas ações`,
          };

          const updatedProducts = [result, ...(prev.launchedProducts || [])];

          // Atualiza departamento de produto
          const updatedDepts = {
            ...prev.departments,
            product: {
              ...prev.departments.product,
              productQuality: result.teveRecall ? Math.max(30, prev.departments.product.productQuality - 10) : Math.min(100, Math.round((prev.departments.product.productQuality + result.qualidadeReal) / 2)),
              currentProduct: `${result.name} (${result.reviewVerdict})`,
            },
          };

          return {
            ...prev,
            cash: nextCash,
            reputation: nextRep,
            stockPrice: nextStockPrice,
            stockHistory: [
              ...prev.stockHistory,
              { day: prev.day + devDays, price: nextStockPrice, event: `Lançamento: ${result.name}` },
            ],
            newsFeed: [newArticle, ...prev.newsFeed],
            launchedProducts: updatedProducts,
            departments: updatedDepts,
            day: prev.day + Math.min(30, Math.round(devDays / 3)), // Simula avanço de tempo
          };
        });

        setLastLaunchResult({
          result,
          news: generatedNews,
        });
      }
    } catch (err) {
      console.error('Falha ao lançar produto:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  const categoriesList: { id: ProductCategory; label: string; icon: any }[] = [
    { id: 'chip', label: 'Chips & IA', icon: Cpu },
    { id: 'smartphone', label: 'Smartphones', icon: Smartphone },
    { id: 'console', label: 'Consoles', icon: Gamepad2 },
    { id: 'tablet', label: 'Tablets', icon: Tablet },
    { id: 'smartwatch', label: 'Smartwatches', icon: Watch },
  ];

  const segmentsList: { id: TargetSegment; label: string; desc: string }[] = [
    { id: 'budget', label: 'Econômico', desc: 'Massa / Preço agressivo' },
    { id: 'mid', label: 'Intermediário', desc: 'Equilíbrio de volume' },
    { id: 'premium', label: 'Flagship', desc: 'Alta margem & prestígio' },
    { id: 'ultra', label: 'Ultra-Entusiasta', desc: 'Nicho sem limites' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <Rocket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Estúdio de P&D & Lançamento de Hardware
            </h2>
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-white/5 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded">
              Motor v2.6
            </span>
          </div>
          <p className="text-xs text-white/50 max-w-2xl">
            Projete chips, celulares, consoles, tablets e relógios. Custos de P&D têm retorno decrescente exponencial (80→90 custa muito mais que 20→30). Cronogramas apertados geram risco real de recall e o hype precisa ser sustentado pela qualidade.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0F1115] border border-white/10 rounded-lg px-4 py-2.5 shrink-0">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-mono block">Caixa Disponível</span>
            <span className="text-lg font-bold text-green-400 font-mono">
              ${gameState.cash.toLocaleString()}
            </span>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-white/40 uppercase font-mono block">Reputação Pública</span>
            <span className="text-lg font-bold text-orange-400 font-mono">
              {gameState.reputation.public}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Product Configurator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Category Selection */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>01.</span> Categoria do Dispositivo
              </span>
              <span className="text-xs text-white/40 font-mono">
                {baseline.tagline}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {categoriesList.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md'
                        : 'bg-[#0F1115] border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-orange-400' : 'text-white/40'}`} />
                    <span className="text-xs font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Name & Target Segment */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>02.</span> Identidade & Segmentação de Mercado
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1.5 font-medium">Nome Comercial do Produto</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    maxLength={40}
                    placeholder="Ex: Vantex Nova Core"
                    className="flex-1 bg-[#0F1115] border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    title="Sugerir nome"
                    className="bg-[#0F1115] hover:bg-white/5 border border-white/10 text-white/60 hover:text-white p-2.5 rounded-lg transition"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1.5 font-medium">Segmento de Preço Alvo</label>
                <div className="grid grid-cols-2 gap-2">
                  {segmentsList.map((seg) => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => handleSelectSegment(seg.id)}
                      className={`px-3 py-2 rounded-lg border text-left transition ${
                        selectedSegment === seg.id
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-[#0F1115] border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{seg.label}</div>
                      <div className="text-[10px] text-white/30 truncate">{seg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Hardware Specifications with Diminishing Returns */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>03.</span> Especificações Técnicas & P&D
              </span>
              <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono">
                <Info className="w-3.5 h-3.5 text-orange-400" />
                <span>Curva de Retorno Decrescente: 80→90 é ~6x mais caro</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Performance */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span>Performance & Potência Bruta</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-orange-400">
                      Peso: {Math.round(baseline.weights.performance * 100)}%
                    </span>
                  </span>
                  <span className="font-mono text-white font-bold">{specs.performance}/100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={specs.performance}
                  onChange={(e) => setSpecs({ ...specs, performance: Number(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Efficiency */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span>Eficiência Energética & Bateria</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-green-400">
                      Peso: {Math.round(baseline.weights.efficiency * 100)}%
                    </span>
                  </span>
                  <span className="font-mono text-white font-bold">{specs.efficiency}/100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={specs.efficiency}
                  onChange={(e) => setSpecs({ ...specs, efficiency: Number(e.target.value) })}
                  className="w-full accent-green-500 cursor-pointer"
                />
              </div>

              {/* Design */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span>Design Industrial & Materiais Nobres</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-purple-400">
                      Peso: {Math.round(baseline.weights.design * 100)}%
                    </span>
                  </span>
                  <span className="font-mono text-white font-bold">{specs.design}/100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={specs.design}
                  onChange={(e) => setSpecs({ ...specs, design: Number(e.target.value) })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Software */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white font-medium flex items-center gap-2">
                    <span>Software, Firmware & Recursos de IA</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-blue-400">
                      Peso: {Math.round(baseline.weights.software * 100)}%
                    </span>
                  </span>
                  <span className="font-mono text-white font-bold">{specs.software}/100</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={specs.software}
                  onChange={(e) => setSpecs({ ...specs, software: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0F1115] border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-white/50">Investimento Total de P&D Calculado:</span>
              <span className="text-orange-400 font-bold text-sm">
                ${currentRdCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Step 4: Prazo de Entrega vs Risco de Recall */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <span>04.</span> Prazo de Desenvolvimento & Risco de Recall
              </span>
              <span className="text-xs text-white/40 font-mono">
                Recomendado: {baseline.recommendedDevDays} dias
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-white/60">Tempo de P&D e Linha de Testes:</span>
                <span className="font-mono text-white font-bold">{devDays} dias</span>
              </div>
              <input
                type="range"
                min={baseline.minDevDays}
                max={baseline.maxRecommendedDevDays}
                step="5"
                value={devDays}
                onChange={(e) => setDevDays(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Risco de Recall Visual Meter */}
            <div className={`p-4 rounded-lg border transition ${
              currentRecallRisk > 30
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : currentRecallRisk > 12
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                : 'bg-green-500/10 border-green-500/30 text-green-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {currentRecallRisk > 30
                      ? 'Zona de Perigo Extremo de Recall'
                      : currentRecallRisk > 12
                      ? 'Risco Moderado de Falhas'
                      : 'Engenharia Madura & Confiável'}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold">
                  {currentRecallRisk}% de Risco de Recall
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {currentRecallRisk > 30
                  ? 'Apressar o cronograma para bater metas de mercado pode gerar catástrofes: baterias com fuga térmica, anel vermelho da morte ou defeitos estruturais. Se ocorrer recall, as devoluções custam milhões e a reputação desaba.'
                  : currentRecallRisk > 12
                  ? 'Prazo ligeiramente curto. Há chance palpável de lotes iniciais apresentarem falhas de software ou montagem.'
                  : 'Prazo suficiente para rigorosos testes de QA e validação de fornecedores. Risco residual insignificante.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Commercial Strategy & Launch Action */}
        <div className="space-y-6">
          {/* Pricing & Commercialization */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>05.</span> Preço & Margem
            </span>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-white/60">Preço de Venda Unitário:</span>
                <span className="font-mono text-white font-bold">${unitPrice}</span>
              </div>
              <input
                type="range"
                min={Math.round(priceTarget.min * 0.7)}
                max={Math.round(priceTarget.max * 1.5)}
                step="10"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
                <span>Min: ${priceTarget.min}</span>
                <span className="text-orange-400 font-bold">Ideal: ${priceTarget.ideal}</span>
                <span>Max: ${priceTarget.max}</span>
              </div>
            </div>

            {/* Price Warning Banner */}
            {isOverpriced && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Sobrepreço: Preço acima do teto do segmento penaliza severamente a demanda e a crítica!</span>
              </div>
            )}
            {isUnderpriced && (
              <div className="p-2.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Preço muito baixo: Percepção de produto barato e margem comprimida.</span>
              </div>
            )}
          </div>

          {/* Marketing & Hype */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <span>06.</span> Campanha de Marketing & Hype
            </span>

            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-white/60">Verba de Lançamento:</span>
                <span className="font-mono text-white font-bold">${marketingBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={marketingBudget}
                onChange={(e) => setMarketingBudget(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0F1115] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Hype de Estreia Projetado:</span>
                <span className="text-orange-400 font-mono font-bold">{projectedHype}/100</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  style={{ width: `${projectedHype}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Hype forte puxa pré-vendas. Se a nota da crítica for medíocre, haverá cancelamentos em massa.
              </p>
            </div>
          </div>

          {/* Launch Action Card */}
          <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-md space-y-4">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-white/60">
                <span>Custo de P&D:</span>
                <span>${currentRdCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Campanha de Marketing:</span>
                <span>${marketingBudget.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between text-white font-bold text-sm">
                <span>Investimento Inicial:</span>
                <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                  ${totalUpfrontCost.toLocaleString()}
                </span>
              </div>
            </div>

            {!canAfford && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                Caixa insuficiente! Você precisa de mais ${(totalUpfrontCost - gameState.cash).toLocaleString()} para custear este projeto.
              </div>
            )}

            <button
              onClick={handleLaunchProduct}
              disabled={!canAfford || isLaunching}
              className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
                canAfford && !isLaunching
                  ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20 active:scale-[0.98]'
                  : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isLaunching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Fabricando & Distribuindo...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>LANÇAR {productName.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Post-Launch Report Modal */}
      {lastLaunchResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14161C] border border-white/20 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Header with Result Type */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl border ${
                  lastLaunchResult.result.teveRecall
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : lastLaunchResult.result.reviewScore >= 80
                    ? 'bg-green-500/10 border-green-500 text-green-400'
                    : 'bg-orange-500/10 border-orange-500 text-orange-400'
                }`}>
                  {lastLaunchResult.result.teveRecall ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Award className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Relatório de Lançamento: {lastLaunchResult.result.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                    <span>{CATEGORY_BASELINE[lastLaunchResult.result.category]?.name}</span>
                    <span>•</span>
                    <span>Segmento: {lastLaunchResult.result.segment.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-xl text-center font-mono border ${
                lastLaunchResult.result.reviewScore >= 80
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : lastLaunchResult.result.reviewScore >= 60
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400'
              }`}>
                <span className="text-[10px] uppercase block tracking-wider">Nota Crítica</span>
                <span className="text-2xl font-black">{lastLaunchResult.result.reviewScore}/100</span>
              </div>
            </div>

            {/* Recall Warning if Applicable */}
            {lastLaunchResult.result.teveRecall && (
              <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  <span>RECALL GLOBAL EMERGENCIAL DECLARADO</span>
                </div>
                <p className="text-xs leading-relaxed">
                  {lastLaunchResult.result.recallReason}
                </p>
                <div className="text-[11px] font-mono text-red-300">
                  Custo direto de indenizações e substituições: ${lastLaunchResult.result.recallCost.toLocaleString()}
                </div>
              </div>
            )}

            {/* Financial Ledger & Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0F1115] border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Unidades</span>
                <span className="text-base font-bold text-white font-mono">
                  {lastLaunchResult.result.unidadesVendidas.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#0F1115] border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Receita Bruta</span>
                <span className="text-base font-bold text-white font-mono">
                  ${lastLaunchResult.result.receitaTotal.toLocaleString()}
                </span>
              </div>

              <div className="bg-[#0F1115] border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[10px] text-white/40 uppercase block font-mono">Custos Totais</span>
                <span className="text-base font-bold text-red-400 font-mono">
                  ${lastLaunchResult.result.custoTotal.toLocaleString()}
                </span>
              </div>

              <div className={`border rounded-xl p-3 text-center ${
                lastLaunchResult.result.lucro >= 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <span className="text-[10px] text-white/40 uppercase block font-mono">Lucro Líquido</span>
                <span className={`text-base font-bold font-mono ${
                  lastLaunchResult.result.lucro >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastLaunchResult.result.lucro >= 0 ? '+' : ''}${lastLaunchResult.result.lucro.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Media Quotes & Satirical News */}
            <div className="space-y-3">
              <div className="bg-[#0F1115] border border-white/5 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400">
                  <Newspaper className="w-4 h-4" />
                  <span>TechPulse News (Cobertura Oficial):</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  "{lastLaunchResult.news.title}"
                </h4>
                <p className="text-xs text-white/70 italic">
                  {lastLaunchResult.news.snippet}
                </p>
              </div>

              <div className="space-y-1.5">
                {lastLaunchResult.result.criticsFeedback.map((quote, idx) => (
                  <div key={idx} className="text-xs text-white/60 bg-white/5 px-3 py-2 rounded-lg font-mono">
                    {quote}
                  </div>
                ))}
              </div>
            </div>

            {/* Reputation & Market Impact Deltas */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span>
                  Pública: <b className={lastLaunchResult.result.reputacaoDelta.public >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {lastLaunchResult.result.reputacaoDelta.public >= 0 ? '+' : ''}{lastLaunchResult.result.reputacaoDelta.public}%
                  </b>
                </span>
                <span>
                  Investidores: <b className={lastLaunchResult.result.reputacaoDelta.investors >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {lastLaunchResult.result.reputacaoDelta.investors >= 0 ? '+' : ''}{lastLaunchResult.result.reputacaoDelta.investors}%
                  </b>
                </span>
                <span>
                  Clientes: <b className={lastLaunchResult.result.reputacaoDelta.customers >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {lastLaunchResult.result.reputacaoDelta.customers >= 0 ? '+' : ''}{lastLaunchResult.result.reputacaoDelta.customers}%
                  </b>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-white/40">Ações $VNTX:</span>
                <span className={`font-bold ${
                  lastLaunchResult.result.eventoDeMercado.impactoAcoes >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastLaunchResult.result.eventoDeMercado.impactoAcoes >= 0 ? '+' : ''}
                  {lastLaunchResult.result.eventoDeMercado.impactoAcoes}%
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setLastLaunchResult(null);
                }}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl shadow transition"
              >
                Voltar à Sala de Operações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio of Previously Launched Products */}
      {gameState.launchedProducts && gameState.launchedProducts.length > 0 && (
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-400" />
              <span>Portfólio de Dispositivos Lançados ({gameState.launchedProducts.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gameState.launchedProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-[#0F1115] border border-white/5 hover:border-white/15 p-4 rounded-xl space-y-2.5 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                    <span className="text-[10px] text-white/40 uppercase font-mono">
                      {CATEGORY_BASELINE[prod.category]?.name} • {prod.segment}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    prod.reviewScore >= 80 ? 'bg-green-500/10 text-green-400' : prod.reviewScore >= 60 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {prod.reviewScore}/100
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/60 pt-1 border-t border-white/5">
                  <div>Vendas: <b className="text-white">{prod.unidadesVendidas.toLocaleString()}</b></div>
                  <div>Lucro: <b className={prod.lucro >= 0 ? 'text-green-400' : 'text-red-400'}>${prod.lucro.toLocaleString()}</b></div>
                </div>

                {prod.teveRecall && (
                  <div className="text-[10px] text-red-400 font-mono flex items-center gap-1 bg-red-500/10 p-1.5 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Recall executado: {prod.recallReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
