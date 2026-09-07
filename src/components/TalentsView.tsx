import React, { useState } from 'react';
import { 
  GameState, 
  RegularStaff, 
  KeyTalent, 
  TrainingProgram, 
  TalentSpecialty, 
  DepartmentId,
  HrEvent,
  HrChoice
} from '../types';
import { CANDIDATE_POOL, TRAINING_PROGRAMS } from '../data/talents';
import { sounds } from '../utils/audio';
import { 
  Users, 
  UserCheck, 
  Award, 
  GraduationCap, 
  AlertOctagon, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  ArrowRight,
  Flame,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface TalentsViewProps {
  gameState: GameState;
  onHireStaff: (candidate: Omit<RegularStaff, 'id' | 'hiredDay'>) => void;
  onFireStaff: (staffId: string) => void;
  onReassignStaff: (staffId: string, dept: DepartmentId) => void;
  onHireKeyTalent: (talentId: string) => void;
  onStartTraining: (program: TrainingProgram, targetSpecialty: TalentSpecialty | 'all') => void;
  onResolveHrEvent: (eventId: string, choice: HrChoice) => void;
}

export const TalentsView: React.FC<TalentsViewProps> = ({
  gameState,
  onHireStaff,
  onFireStaff,
  onReassignStaff,
  onHireKeyTalent,
  onStartTraining,
  onResolveHrEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'keyTalents' | 'training' | 'events'>('staff');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [showHireModal, setShowHireModal] = useState<boolean>(false);

  const staff = gameState.staffMembers || [];
  const keyTalents = gameState.keyTalents || [];
  const activeTraining = gameState.activeTraining;
  const activeHrEvents = gameState.activeHrEvents || [];

  // Metrics
  const totalHeadcount = staff.length + keyTalents.filter(k => k.isHired).length;
  const avgMorale = staff.length > 0 
    ? Math.round(staff.reduce((acc, s) => acc + s.morale, 0) / staff.length) 
    : 50;
  const totalQuarterPayroll = 
    staff.reduce((acc, s) => acc + s.salary, 0) + 
    keyTalents.filter(k => k.isHired).reduce((acc, k) => acc + k.salary, 0);

  const specialtyLabels: Record<TalentSpecialty, string> = {
    engineering: 'Engenharia de Software',
    marketing: 'Marketing & Growth',
    finance: 'Finanças & M&A',
    rd: 'P&D e Inteligência Artificial',
    legal: 'Jurídico & Governança',
  };

  const deptLabels: Record<DepartmentId, string> = {
    product: 'Produto & Dev',
    marketing: 'Marketing',
    hr: 'Recursos Humanos',
    legal: 'Jurídico & Compliance',
    rd: 'P&D & Patentes',
  };

  const filteredStaff = staff.filter((s) => {
    if (filterSpecialty === 'all') return true;
    return s.specialty === filterSpecialty;
  });

  return (
    <div id="talents-management-view" className="h-full flex flex-col space-y-4 max-w-7xl mx-auto w-full">
      {/* Top Banner with HR Analytics */}
      <div className="bg-[#101218] border border-zinc-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Gestão de Talentos & Recursos Humanos
                {activeHrEvents.length > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3" /> {activeHrEvents.length} Decisão Pendente
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-400">
                Recrute especialistas, contrate talentos lendários do C-Suite e capacite suas equipes para dominar o mercado
              </p>
            </div>
          </div>

          {/* Key HR Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className="bg-[#0B0D12] border border-zinc-800/80 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Quadro Total</span>
              <span className="text-base font-bold text-zinc-200">{totalHeadcount} colaboradores</span>
            </div>

            <div className="bg-[#0B0D12] border border-zinc-800/80 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Moral da Equipe</span>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${avgMorale < 40 ? 'text-rose-400 animate-pulse' : avgMorale >= 70 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {avgMorale}%
                </span>
                <span className="text-[10px] text-zinc-500">
                  {avgMorale < 40 ? '(Risco de Greve)' : avgMorale >= 70 ? '(Alta Produtividade)' : '(Estável)'}
                </span>
              </div>
            </div>

            <div className="bg-[#0B0D12] border border-zinc-800/80 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Folha Salarial</span>
              <span className="text-base font-bold text-zinc-200">${totalQuarterPayroll.toLocaleString()}/tri</span>
            </div>

            <div className="bg-[#0B0D12] border border-zinc-800/80 rounded-lg px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Talentos-Chave</span>
              <span className="text-base font-bold text-indigo-300">
                {keyTalents.filter(k => k.isHired).length} / {keyTalents.length}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('staff');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeSubTab === 'staff'
                ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-500/50 shadow-sm'
                : 'bg-[#12141C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Quadro de Funcionários ({staff.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('keyTalents');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeSubTab === 'keyTalents'
                ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-500/50 shadow-sm'
                : 'bg-[#12141C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Talentos-Chave & C-Suite ({keyTalents.filter(k => k.isHired).length} contratados)
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('training');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeSubTab === 'training'
                ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-500/50 shadow-sm'
                : 'bg-[#12141C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Treinamento Corporativo
            {activeTraining && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveSubTab('events');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeSubTab === 'events'
                ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50 shadow-sm'
                : 'bg-[#12141C] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            Eventos & Crises de RH
            {activeHrEvents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                {activeHrEvents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* SUBTAB 1: QUADRO DE FUNCIONÁRIOS (STAFF) */}
        {activeSubTab === 'staff' && (
          <div className="space-y-4">
            {/* Filter Bar and Hire Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#101218] border border-zinc-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-xs text-zinc-500 font-semibold uppercase pr-2">Especialidade:</span>
                {['all', 'engineering', 'marketing', 'finance', 'rd', 'legal'].map((spec) => (
                  <button
                    key={spec}
                    onClick={() => {
                      sounds.playClick();
                      setFilterSpecialty(spec);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      filterSpecialty === spec
                        ? 'bg-zinc-700 text-zinc-100 font-semibold'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {spec === 'all' ? 'Todas' : specialtyLabels[spec as TalentSpecialty].split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setShowHireModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Contratar Novo Colaborador
              </button>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="bg-[#101218] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-100">{member.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-indigo-300">
                            {specialtyLabels[member.specialty]}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                            Nível {member.tier}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                        ${member.salary.toLocaleString()}/tri
                      </span>
                    </div>

                    {/* Skill level & Morale bars */}
                    <div className="space-y-2 mt-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Habilidade Técnica</span>
                          <span className="font-semibold text-zinc-200">{member.skillLevel} / 10</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                            style={{ width: `${(member.skillLevel / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Moral do Colaborador</span>
                          <span className={`font-semibold ${member.morale < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {member.morale}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              member.morale < 40 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${member.morale}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Department Assignment & Dismissal */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 block mb-1">Alocar em Departamento:</label>
                      <select
                        value={member.assignedDept}
                        onChange={(e) => {
                          sounds.playClick();
                          onReassignStaff(member.id, e.target.value as DepartmentId);
                        }}
                        className="w-full bg-[#161922] border border-zinc-700 rounded text-xs text-zinc-200 px-2 py-1 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="product">Produto & Dev</option>
                        <option value="marketing">Marketing & Growth</option>
                        <option value="rd">P&D & Patentes</option>
                        <option value="legal">Jurídico & Compliance</option>
                        <option value="hr">Recursos Humanos</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playClick();
                        onFireStaff(member.id);
                      }}
                      className="mt-4 px-2.5 py-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-800/40 transition-all"
                      title="Demitir colaborador"
                    >
                      Demitir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 2: TALENTOS-CHAVE & C-SUITE STARS */}
        {activeSubTab === 'keyTalents' && (
          <div className="space-y-4">
            <div className="bg-[#101218] border border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-xs text-zinc-300">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-semibold text-zinc-100">Talentos Lendários do Mercado:</span>
                <p className="text-zinc-400 mt-0.5">
                  Contratar executivos renomados traz bônus únicos permanentes (redução de juros, imunidade a auditorias, salto em qualidade de produto e velocidade em patentes).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {keyTalents.map((talent) => {
                const canAfford = gameState.cash >= talent.signingBonus;

                return (
                  <div
                    key={talent.id}
                    className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${
                      talent.isHired
                        ? 'bg-[#141724] border-indigo-500/50 shadow-md'
                        : 'bg-[#101218] border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-950 to-purple-900 border border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-300 shadow-inner">
                            {talent.avatarBadge}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-zinc-100">{talent.name}</h3>
                              {talent.isHired && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  Contratado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 font-medium">{talent.title}</p>
                          </div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <span className="text-zinc-400 block">${talent.salary.toLocaleString()}/tri</span>
                          {!talent.isHired && (
                            <span className="text-[10px] text-amber-400">Luvas: ${talent.signingBonus.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-zinc-300 leading-relaxed italic mb-4">
                        "{talent.bio}"
                      </p>

                      {/* Unique Perk Card */}
                      <div className="bg-[#0D0F15] border border-amber-500/30 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Habilidade Única: {talent.uniquePerk.name}
                        </div>
                        <p className="text-xs text-zinc-400 leading-normal">
                          {talent.uniquePerk.description}
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        Departamento: <span className="text-zinc-200 font-medium">{deptLabels[talent.assignedDept]}</span>
                      </span>

                      {talent.isHired ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <CheckCircle className="w-4 h-4" /> Ativo no Comitê Executivo
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            sounds.playCashChime();
                            onHireKeyTalent(talent.id);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          }`}
                        >
                          {canAfford ? `Contratar (Pagar $${talent.signingBonus.toLocaleString()})` : 'Caixa Insuficiente'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 3: TREINAMENTO CORPORATIVO */}
        {activeSubTab === 'training' && (
          <div className="space-y-4">
            {/* Active Training Status Banner */}
            {activeTraining ? (
              <div className="bg-[#141724] border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Treinamento em Andamento</span>
                    <h3 className="text-sm font-bold text-zinc-100">{activeTraining.programName}</h3>
                    <p className="text-xs text-zinc-400">
                      Restam <span className="text-emerald-300 font-bold">{activeTraining.daysRemaining} dias</span> para a graduação da equipe.
                    </p>
                  </div>
                </div>

                <div className="w-48 hidden sm:block">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(((activeTraining.totalDays - activeTraining.daysRemaining) / activeTraining.totalDays) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.round(((activeTraining.totalDays - activeTraining.daysRemaining) / activeTraining.totalDays) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#101218] border border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-xs text-zinc-300">
                <GraduationCap className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <p className="text-zinc-400">
                  Invista na capacitação contínua da sua equipe para desbloquear níveis avançados de habilidade técnica e elevar a moral interna.
                </p>
              </div>
            )}

            {/* Programs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRAINING_PROGRAMS.map((program) => {
                const canAfford = gameState.cash >= program.cost;
                const isOngoing = activeTraining?.programId === program.id;

                return (
                  <div
                    key={program.id}
                    className="bg-[#101218] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-bold text-zinc-100">{program.name}</h3>
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          ${program.cost.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                        {program.description}
                      </p>

                      <div className="grid grid-cols-3 gap-2 bg-[#0C0E14] border border-zinc-800/80 rounded-lg p-2.5 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Duração</span>
                          <span className="font-semibold text-zinc-200">{program.durationDays} dias</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Ganho Técnico</span>
                          <span className="font-semibold text-cyan-400">+{program.skillGain} Pontos</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Impacto Moral</span>
                          <span className="font-semibold text-emerald-400">+{program.moraleGain}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!canAfford || Boolean(activeTraining)}
                      onClick={() => {
                        sounds.playCashChime();
                        onStartTraining(program, program.targetSpecialty);
                      }}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
                        isOngoing
                          ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-300'
                          : canAfford && !activeTraining
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-98'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      }`}
                    >
                      {isOngoing
                        ? 'Treinamento em Andamento'
                        : activeTraining
                        ? 'Aguarde o término do treinamento atual'
                        : canAfford
                        ? `Iniciar Treinamento ($${program.cost.toLocaleString()})`
                        : 'Caixa Insuficiente'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 4: EVENTOS & CRISES DE RH */}
        {activeSubTab === 'events' && (
          <div className="space-y-4">
            {activeHrEvents.length === 0 ? (
              <div className="bg-[#101218] border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 space-y-2">
                <HeartHandshake className="w-12 h-12 mx-auto text-zinc-700" />
                <h3 className="text-sm font-semibold text-zinc-300">Clima Organizacional Estável</h3>
                <p className="text-xs max-w-md mx-auto">
                  Nenhum conflito trabalhista ou dilema de RH no momento. Continue monitorando a moral da equipe para evitar greves e aliciamento por rivais.
                </p>
              </div>
            ) : (
              activeHrEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#12141D] border-2 border-amber-500/50 rounded-xl p-6 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400">
                        <AlertOctagon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Dilema Crítico de Recursos Humanos
                        </span>
                        <h2 className="text-lg font-bold text-zinc-100">{event.title}</h2>
                      </div>
                    </div>

                    {event.rivalInvolved && (
                      <span className="px-2.5 py-1 rounded text-xs bg-red-950/60 border border-red-500/40 text-red-300 font-semibold">
                        Rival Envolvido: {event.rivalInvolved}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed bg-[#0B0D12] p-3.5 rounded-lg border border-zinc-800/80">
                    {event.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Escolha uma Resolução Executiva:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {event.choices.map((choice) => {
                        const canAfford = gameState.cash >= choice.cost;

                        return (
                          <button
                            key={choice.id}
                            disabled={!canAfford}
                            onClick={() => {
                              sounds.playGavelStrike();
                              onResolveHrEvent(event.id, choice);
                            }}
                            className={`p-4 rounded-xl border text-left flex flex-col justify-between space-y-3 transition-all ${
                              canAfford
                                ? 'bg-[#151824] hover:bg-[#1a1e2e] border-zinc-700 hover:border-amber-500/60 text-zinc-200 active:scale-98'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-bold text-zinc-100 leading-snug mb-1">
                                {choice.label}
                              </h4>
                              <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                                {choice.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                              <span className={choice.cost > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                                {choice.cost > 0 ? `Custo: $${choice.cost.toLocaleString()}` : 'Sem Custo Imediato'}
                              </span>
                              <span className={choice.moraleDelta >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {choice.moraleDelta >= 0 ? `+${choice.moraleDelta}% Moral` : `${choice.moraleDelta}% Moral`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12151E] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Banco de Talentos & Candidatos</h3>
                <p className="text-xs text-zinc-400">Selecione profissionais disponíveis para integrar sua equipe.</p>
              </div>
              <button
                onClick={() => setShowHireModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 text-xs"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-800/60">
              {CANDIDATE_POOL.map((candidate, idx) => {
                const canAfford = gameState.cash >= candidate.salary;
                return (
                  <div key={idx} className="pt-3 pb-2 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">{candidate.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="text-indigo-300 font-medium">{specialtyLabels[candidate.specialty]}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] tracking-wider">{candidate.tier}</span>
                        <span>•</span>
                        <span>Habilidade: {candidate.skillLevel}/10</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-zinc-300">
                        ${candidate.salary.toLocaleString()}/tri
                      </span>
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          sounds.playCashChime();
                          onHireStaff(candidate);
                          setShowHireModal(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        Contratar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
