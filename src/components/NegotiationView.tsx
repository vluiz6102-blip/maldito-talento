import React, { useState, useRef, useEffect } from 'react';
import { GameState, NegotiationCharacter, DialogueMessage } from '../types';
import { NEGOTIATION_CHARACTERS } from '../data/characters';
import { 
  Send, 
  Sparkles, 
  AlertCircle, 
  FileCheck, 
  DollarSign, 
  Building2, 
  Percent, 
  Clock, 
  UserX,
  Smile,
  Frown,
  Meh,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface NegotiationViewProps {
  gameState: GameState;
  onUpdateGameState: (nextState: GameState) => void;
}

export const NegotiationView: React.FC<NegotiationViewProps> = ({
  gameState,
  onUpdateGameState,
}) => {
  // Characters list initialized
  const [characters, setCharacters] = useState<Record<string, NegotiationCharacter>>(() => {
    return JSON.parse(JSON.stringify(NEGOTIATION_CHARACTERS));
  });

  const [selectedCharId, setSelectedCharId] = useState<string>('confianca_barreto');
  const [messagesByChar, setMessagesByChar] = useState<Record<string, DialogueMessage[]>>(() => {
    return {
      confianca_barreto: [
        {
          id: 'm1',
          sender: 'character',
          senderName: 'Dr. Osvaldo Barreto',
          text: 'CEO, não gaste meu tempo com desculpas. Arthur Vance deixou um rombo de meio milhão de dólares com o Confiança Federal. Ou você traz um plano de pagamento consistente e garantias, ou o mandado de penhora será executado em breve.',
          timestamp: 'Hoje, 09:15',
        },
      ],
      rockridge_stone: [
        {
          id: 'm2',
          sender: 'character',
          senderName: 'Gordon Stone',
          text: 'Ouvi dizer que você assumiu a carcaça da Vantex Dynamics. Nós compramos dívidas podres com desconto e fatiamos empresas. Se você quiser dinheiro fresco para se salvar, vai me custar equity e controle.',
          timestamp: 'Hoje, 10:30',
        },
      ],
      nuverde_lins: [
        {
          id: 'm3',
          sender: 'character',
          senderName: 'Camila Lins',
          text: 'Olá, CEO! Acompanhamos a turbulência da Vantex. Acreditamos que seu software ainda tem grande valor de mercado. Estamos dispostos a abrir uma linha de crédito se vocês integrarem com nossos serviços.',
          timestamp: 'Hoje, 11:00',
        },
      ],
    };
  });

  const [inputText, setInputText] = useState('');
  const [selectedTactic, setSelectedTactic] = useState<string>('data');
  const [isSending, setIsSending] = useState(false);
  const [signedDeals, setSignedDeals] = useState<Set<string>>(new Set());
  const [contractNotice, setContractNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChar = characters[selectedCharId] || Object.values(characters)[0];
  const activeMessages = messagesByChar[selectedCharId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isSending]);

  const handleSendMessage = async (customMessage?: string, tacticOverride?: string) => {
    const textToSend = (customMessage || inputText).trim();
    if (!textToSend || isSending) return;

    sounds.playClick();
    const tacticToUse = tacticOverride || selectedTactic;

    const userMsg: DialogueMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'player',
      senderName: `CEO ${gameState.ceoName}`,
      text: textToSend,
      tacticUsed: tacticToUse,
      timestamp: 'Agora',
    };

    const updatedHistory = [...activeMessages, userMsg];
    setMessagesByChar(prev => ({
      ...prev,
      [selectedCharId]: updatedHistory,
    }));
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: activeChar,
          history: updatedHistory,
          playerMessage: textToSend,
          tactic: tacticToUse,
          gameState: {
            cash: gameState.cash,
            debt: gameState.debt,
            debtDeadlineDays: gameState.debtDeadlineDays,
            era: gameState.era,
            stockPrice: gameState.stockPrice,
            reputation: gameState.reputation,
          },
        }),
      });

      const data = await response.json();

      if (data) {
        const charMsg: DialogueMessage = {
          id: `msg_char_${Date.now()}`,
          sender: 'character',
          senderName: activeChar.name,
          text: data.reply || 'Entendo sua colocação. Vamos analisar.',
          moodChange: data.mood,
          timestamp: 'Agora',
        };

        setMessagesByChar(prev => ({
          ...prev,
          [selectedCharId]: [...prev[selectedCharId], charMsg],
        }));

        // Update patience and mood
        setCharacters(prev => {
          const current = prev[selectedCharId];
          const newPatience = Math.max(0, Math.min(100, (current.currentPatience || 60) + (data.patienceDelta || 0)));
          return {
            ...prev,
            [selectedCharId]: {
              ...current,
              currentPatience: newPatience,
              mood: data.mood || current.mood,
              dealStatus: data.dealStatus || current.dealStatus,
            },
          };
        });

        if (data.dealStatus === 'walkout') {
          sounds.playWarningBeep();
        } else {
          sounds.playClick();
        }
      }
    } catch (err) {
      console.error('Negotiation request error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignContract = () => {
    if (!activeChar.activeContractProposal) return;
    const proposal = activeChar.activeContractProposal;

    // Check if player has enough cash if cashEffect is negative
    if (proposal.cashEffect < 0 && gameState.cash < Math.abs(proposal.cashEffect)) {
      sounds.playWarningBeep();
      setContractNotice({
        message: `Saldo insuficiente em caixa para este contrato! Necessário: $${Math.abs(proposal.cashEffect).toLocaleString()}`,
        type: 'error',
      });
      return;
    }

    sounds.playPenSign();
    sounds.playCashChime();

    setContractNotice({
      message: `Contrato formalizado com sucesso! Termos do acordo em vigor.`,
      type: 'success',
    });

    const nextState: GameState = JSON.parse(JSON.stringify(gameState));

    // Apply financial effects
    nextState.cash += proposal.cashEffect;
    if (proposal.debtEffect !== 0) {
      nextState.debt = Math.max(0, nextState.debt + proposal.debtEffect);
    }
    if (proposal.debtDaysExtension > 0) {
      nextState.debtDeadlineDays += proposal.debtDaysExtension;
    }
    if (proposal.equityEffect !== 0) {
      nextState.playerSharesPercent = Math.max(10, nextState.playerSharesPercent + proposal.equityEffect);
    }
    if (proposal.revenueBoost > 0) {
      nextState.quarterlyRevenue += proposal.revenueBoost;
    }
    if (proposal.reputationEffect !== 0) {
      nextState.reputation.investors = Math.min(100, Math.max(0, nextState.reputation.investors + proposal.reputationEffect));
      nextState.reputation.public = Math.min(100, Math.max(0, nextState.reputation.public + Math.round(proposal.reputationEffect / 2)));
    }

    // Add News Article
    nextState.newsFeed.unshift({
      id: `news_deal_${Date.now()}`,
      day: nextState.day,
      quarter: nextState.quarter,
      source: 'TechPulse News',
      title: `CONTRATO FECHADO: Vantex Dynamics assina ${proposal.title}`,
      snippet: `Acordo formalizado com ${activeChar.company} traz alívio financeiro e novo horizonte estratégico para a companhia.`,
      sentiment: 'bullish',
    });

    onUpdateGameState(nextState);
    setSignedDeals(prev => new Set(prev).add(proposal.id));

    // Append system message in chat
    const systemMsg: DialogueMessage = {
      id: `msg_sys_${Date.now()}`,
      sender: 'system',
      senderName: 'SISTEMA JURÍDICO',
      text: `Contrato "${proposal.title}" homologado e assinado digitalmente com sucesso! Termos incorporados ao balanço.`,
      timestamp: 'Agora',
    };

    setMessagesByChar(prev => ({
      ...prev,
      [selectedCharId]: [...(prev[selectedCharId] || []), systemMsg],
    }));
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'furious': return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'skeptical': return <Frown className="w-3.5 h-3.5 text-amber-500" />;
      case 'neutral': return <Meh className="w-3.5 h-3.5 text-slate-400" />;
      case 'interested':
      case 'cautious': return <Smile className="w-3.5 h-3.5 text-cyan-400" />;
      case 'convinced': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default: return null;
    }
  };

  const isDealSigned = activeChar.activeContractProposal && signedDeals.has(activeChar.activeContractProposal.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-10">
      {/* Contact Dossier Sidebar (4 cols) */}
      <div className="md:col-span-4 space-y-3">
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-1 flex items-center justify-between uppercase tracking-wide">
            <span>Contatos Estratégicos</span>
            <span className="text-[10px] font-mono text-orange-500">SALA EXECUTIVA</span>
          </h3>
          <p className="text-xs text-white/50 mb-4 leading-relaxed">
            Negocie prazos, capte investimentos ou forme alianças via IA. Suas respostas moldam a paciência e os termos de cada executivo.
          </p>

          <div className="space-y-2">
            {(Object.values(characters) as NegotiationCharacter[]).map((char) => {
              const isSelected = selectedCharId === char.id;
              const hasDeal = Boolean(char.activeContractProposal && !signedDeals.has(char.activeContractProposal.id));

              return (
                <button
                  key={char.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCharId(char.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-white/10 border-orange-500/50 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${char.avatarBadgeColor} flex items-center justify-center font-serif font-bold text-white text-xs shrink-0 shadow`}>
                    {char.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-bold text-xs truncate text-white">
                        {char.name}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {getMoodIcon(char.mood)}
                        <span className="text-[10px] font-mono font-bold text-white/50">
                          {char.currentPatience}%
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-orange-400 font-mono truncate">
                      {char.company}
                    </div>
                    {hasDeal && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-green-400 font-semibold font-mono">
                        <FileCheck className="w-3 h-3" />
                        <span>Proposta de Contrato</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Counterpart Profile Card */}
        <div className="bg-[#14161C] border border-white/10 rounded-xl p-4 text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[10px] text-white/40 font-mono">Perfil Psicológico</span>
            <div className="flex items-center gap-1 text-[11px] text-white/70">
              <span className="text-white/40">Humor:</span>
              <span className="capitalize font-bold text-orange-400 font-mono">{activeChar.mood}</span>
            </div>
          </div>
          <p className="text-white/70 italic leading-relaxed">
            "{activeChar.personality}"
          </p>
          <div>
            <span className="text-[10px] font-semibold text-white/40 uppercase font-mono tracking-wider">Interesses Chave:</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {activeChar.interests.map((interest, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Chat Window (8 cols) */}
      <div className="md:col-span-8 bg-[#14161C] border border-white/10 rounded-xl flex flex-col h-[650px] shadow-2xl overflow-hidden">
        {/* Chat Room Header */}
        <div className="p-4 border-b border-white/10 bg-[#0F1115] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg ${activeChar.avatarBadgeColor} flex items-center justify-center font-serif font-bold text-white text-sm shrink-0 shadow`}>
              {activeChar.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{activeChar.name}</h4>
                <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-orange-400 border border-white/10 font-mono uppercase">
                  {activeChar.company}
                </span>
              </div>
              <div className="text-[11px] text-white/40 truncate">{activeChar.title}</div>
            </div>
          </div>

          {/* Patience Bar */}
          <div className="text-right shrink-0">
            <div className="text-[10px] text-white/40 flex items-center justify-end gap-1 mb-1 font-mono uppercase">
              <Clock className="w-3 h-3 text-orange-500" />
              <span>Paciência:</span>
              <strong className={activeChar.currentPatience < 25 ? 'text-red-400' : 'text-white'}>
                {activeChar.currentPatience}%
              </strong>
            </div>
            <div className="w-24 sm:w-32 bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  activeChar.currentPatience < 25 
                    ? 'bg-red-500' 
                    : activeChar.currentPatience < 50 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${activeChar.currentPatience}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contract Proposal Banner (if character offers a contract) */}
        {activeChar.activeContractProposal && (
          <div className={`p-4 border-b text-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDealSigned 
              ? 'bg-green-500/10 border-green-500/20 text-green-300' 
              : 'bg-orange-500/10 border-orange-500/20 text-orange-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileCheck className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="uppercase tracking-wide">{activeChar.activeContractProposal.title}</span>
                {isDealSigned && (
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] font-mono font-bold">
                    ASSINADO & VIGENTE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 max-w-xl leading-relaxed">
                {activeChar.activeContractProposal.termsText}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-white/50 pt-1">
                {activeChar.activeContractProposal.cashEffect !== 0 && (
                  <span className={activeChar.activeContractProposal.cashEffect > 0 ? 'text-green-400' : 'text-red-400'}>
                    Caixa: {activeChar.activeContractProposal.cashEffect > 0 ? '+' : ''}${activeChar.activeContractProposal.cashEffect.toLocaleString()}
                  </span>
                )}
                {activeChar.activeContractProposal.debtDaysExtension > 0 && (
                  <span className="text-blue-400">
                    Prazo Dívida: +{activeChar.activeContractProposal.debtDaysExtension} dias
                  </span>
                )}
                {activeChar.activeContractProposal.equityEffect !== 0 && (
                  <span className="text-orange-400">
                    Equity Cedido: {Math.abs(activeChar.activeContractProposal.equityEffect)}%
                  </span>
                )}
              </div>
              {contractNotice && (
                <div className={`mt-2 p-2 rounded text-[11px] font-mono flex items-center gap-1.5 ${
                  contractNotice.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {contractNotice.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{contractNotice.message}</span>
                </div>
              )}
            </div>

            {!isDealSigned ? (
              <button
                onClick={handleSignContract}
                className="px-4 py-2.5 rounded bg-white text-black hover:bg-orange-500 hover:text-white uppercase font-bold text-xs tracking-wider transition shadow shrink-0"
              >
                Assinar Acordo
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-mono font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Homologado</span>
              </div>
            )}
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeMessages.map((msg) => {
            const isMe = msg.sender === 'player';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-mono inline-flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold font-serif ${
                  isMe ? 'bg-orange-600 text-white' : `${activeChar.avatarBadgeColor} text-white`
                }`}>
                  {isMe ? 'V' : activeChar.name.charAt(0)}
                </div>
                <div>
                  <div className={`flex items-center gap-2 text-[10px] text-white/40 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-white/60">{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.tacticUsed && (
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-orange-400 text-[9px] font-mono font-bold">
                        {msg.tacticUsed === 'data' && '📊 Métricas'}
                        {msg.tacticUsed === 'bluff' && '🃏 Blefe'}
                        {msg.tacticUsed === 'equity' && '📈 Equity'}
                        {msg.tacticUsed === 'threat' && '⚡ Ameaça'}
                        {msg.tacticUsed === 'charm' && '🤝 Visão'}
                      </span>
                    )}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-orange-600 text-white rounded-tr-none font-normal shadow'
                      : 'bg-[#1A1D24] text-[#E0E0E0] rounded-tl-none border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-2.5 max-w-[70%] mr-auto items-center text-xs text-white/40 italic">
              <div className={`w-7 h-7 rounded-full ${activeChar.avatarBadgeColor} flex items-center justify-center text-white text-xs font-serif font-bold`}>
                {activeChar.name.charAt(0)}
              </div>
              <div className="bg-[#1A1D24] border border-white/10 p-2.5 rounded-xl flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                <span>{activeChar.name} está redigindo a resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Tactical Quick Triggers */}
        <div className="p-2.5 border-t border-white/10 bg-[#0F1115] flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase text-white/40 mr-1 font-mono hidden sm:inline">Táticas:</span>
          
          <button
            onClick={() => {
              setSelectedTactic('data');
              handleSendMessage('Aqui estão nossos números reais do trimestre: estancamos o rombo e nossa margem bruta projetada supera 40%.', 'data');
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition font-mono"
          >
            📊 Métricas Reais
          </button>

          <button
            onClick={() => {
              setSelectedTactic('bluff');
              handleSendMessage('Estamos em conversas avançadas com outros dois fundos institucionais. Se vocês hesitarem, perderão a alocação prioritária.', 'bluff');
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition font-mono"
          >
            🃏 Blefe de Mercado
          </button>

          <button
            onClick={() => {
              setSelectedTactic('equity');
              handleSendMessage('Estamos dispostos a discutir participação societária em equity na Vantex para alinharmos os interesses de longo prazo.', 'equity');
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition font-mono"
          >
            📈 Oferecer Equity
          </button>

          <button
            onClick={() => {
              setSelectedTactic('threat');
              handleSendMessage('Nós não aceitaremos condições predatórias. Se forçarem a barra, levaremos o caso a público e ao tribunal antitruste.', 'threat');
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition font-mono"
          >
            ⚡ Jogar Duro
          </button>

          <button
            onClick={() => {
              setSelectedTactic('charm');
              handleSendMessage('Nossa visão é construir uma nova referência ética e sustentável em tecnologia corporativa. Junte-se a essa virada.', 'charm');
            }}
            disabled={isSending}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 text-[11px] border border-white/10 transition font-mono"
          >
            🤝 Apelo Ético
          </button>
        </div>

        {/* Freeform Message Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-white/10 bg-[#14161C] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder={`Fale diretamente com ${activeChar.name}...`}
            className="flex-1 bg-[#0A0B0E] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition font-sans"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shrink-0"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
