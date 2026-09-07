import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { sounds } from '../utils/audio';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Building2, 
  Zap, 
  Share2, 
  Bookmark, 
  Search, 
  Filter, 
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface NewsFeedViewProps {
  articles: NewsArticle[];
  currentDay: number;
  currentQuarter: number;
}

export const NewsFeedView: React.FC<NewsFeedViewProps> = ({
  articles,
  currentDay,
  currentQuarter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(articles[0] || null);

  const categories = [
    { id: 'all', label: 'Todas as Notícias' },
    { id: 'vantex', label: 'Vantex Dynamics' },
    { id: 'rivals', label: 'Concorrentes (Amazora, Metaphase, Orange)' },
    { id: 'market', label: 'Mercado Financeiro & Wall Street' },
    { id: 'scandal', label: 'Escândalos & Vazamentos' },
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'vantex' && (art.category === 'vantex' || !art.category)) ||
      (selectedCategory === 'rivals' && art.category === 'rivals') ||
      (selectedCategory === 'market' && art.category === 'market') ||
      (selectedCategory === 'scandal' && (art.category === 'scandal' || art.sentiment === 'scandal'));

    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.author && art.author.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getSentimentBadge = (sentiment: NewsArticle['sentiment']) => {
    switch (sentiment) {
      case 'bullish':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Alta de Mercado
          </span>
        );
      case 'bearish':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/80 border border-rose-500/40 text-rose-300">
            <TrendingDown className="w-3 h-3 text-rose-400" /> Alerta de Baixa
          </span>
        );
      case 'scandal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 border border-amber-500/50 text-amber-300 animate-pulse">
            <Flame className="w-3 h-3 text-amber-400" /> Escândalo / Vazamento
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Zap className="w-3 h-3 text-zinc-400" /> Neutro
          </span>
        );
    }
  };

  const getBrandTag = (brandId?: string) => {
    switch (brandId) {
      case 'amazora':
        return <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">Amazora Logistics</span>;
      case 'metaphase':
        return <span className="px-2 py-0.5 rounded text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30">Metaphase Inc</span>;
      case 'orange':
        return <span className="px-2 py-0.5 rounded text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/30">Orange Inc</span>;
      case 'winsoft':
        return <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">WinSoft Corp</span>;
      default:
        return null;
    }
  };

  return (
    <div id="techpulse-news-view" className="h-full flex flex-col space-y-4 max-w-7xl mx-auto w-full">
      {/* Top Header Banner */}
      <div className="bg-[#101218] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                TechPulse News
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-red-600/30 border border-red-500 text-red-300 rounded tracking-wider uppercase">
                  Feed Ao Vivo
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Cobertura editorial em tempo real sobre Vantex Dynamics, concorrentes Big Tech e mercados globais
            </p>
          </div>
        </div>

        {/* Breaking News Ticker in Header */}
        <div className="bg-[#0B0D12] border border-zinc-800/80 rounded-lg px-3 py-2 flex items-center gap-2 w-full md:w-auto max-w-md">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Última Hora:</span>
          <span className="text-xs text-zinc-300 truncate">
            {articles[0]?.title || 'Aguardando novas atualizações do mercado...'}
          </span>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sounds.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-red-950/80 text-red-200 border border-red-500/50 shadow-sm'
                  : 'bg-[#12141C] text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar manchetes, rivais ou temas..."
            className="w-full bg-[#12141C] border border-zinc-800 focus:border-red-500/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content: Split List & Full Article Reader */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Headlines Feed List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#101218] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 border-b border-zinc-800 bg-[#0E1015] flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Manchetes ({filteredArticles.length})</span>
            <span className="text-[11px] text-zinc-500 font-normal">Dia {currentDay} • T{currentQuarter}</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1">
            {filteredArticles.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Nenhuma notícia encontrada com os filtros selecionados.
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isSelected = selectedArticle?.id === article.id;
                return (
                  <div
                    key={article.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedArticle(article);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#181C26] border-red-500/40 text-zinc-100 shadow-sm'
                        : 'bg-[#12141C]/60 hover:bg-[#151822] border-transparent text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {article.source}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Dia {article.day}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-1">
                      {article.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-2 mb-2 font-normal">
                      {article.snippet}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getSentimentBadge(article.sentiment)}
                        {getBrandTag(article.relatedBrand)}
                      </div>
                      {article.marketImpact && (
                        <span className="text-[10px] text-zinc-400 font-mono italic truncate max-w-[120px]">
                          {article.marketImpact}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Article Reader (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#101218] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
          {selectedArticle ? (
            <div className="h-full flex flex-col overflow-y-auto p-6 space-y-5">
              {/* Meta tags & publication info */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-xs text-zinc-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedArticle.source}
                  </span>
                  <span>•</span>
                  <span>Publicado no Dia {selectedArticle.day} (Trimestre {selectedArticle.quarter})</span>
                  {selectedArticle.author && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-300 font-medium">Por {selectedArticle.author}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getSentimentBadge(selectedArticle.sentiment)}
                  {getBrandTag(selectedArticle.relatedBrand)}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-zinc-100 tracking-tight leading-snug">
                {selectedArticle.title}
              </h2>

              {/* Market Impact Box */}
              {selectedArticle.marketImpact && (
                <div className="bg-[#141722] border-l-4 border-red-500 rounded-r-lg p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="font-semibold text-zinc-200">Repercussão no Mercado:</span>
                    <span>{selectedArticle.marketImpact}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">Índice TechPulse Global</span>
                </div>
              )}

              {/* Lead Snippet */}
              <div className="text-sm font-medium text-zinc-300 leading-relaxed italic border-b border-zinc-800/80 pb-4">
                "{selectedArticle.snippet}"
              </div>

              {/* Full Content Body */}
              <div className="text-sm text-zinc-300 leading-relaxed space-y-4 font-normal whitespace-pre-line">
                {selectedArticle.fullContent || selectedArticle.snippet}
              </div>

              {/* Footer analysis & corporate context */}
              <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Fonte: Serviço Noticioso TechPulse Terminal • Criptografia SHA-256</span>
                <span className="text-zinc-400">CEO Empire • Simulação Corporativa</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500">
              <Newspaper className="w-12 h-12 mb-3 text-zinc-700" />
              <p className="text-sm font-medium">Selecione uma manchete à esquerda para ler a matéria completa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
