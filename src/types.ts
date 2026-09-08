import { ProductLaunchResult } from './utils/productSystem';

export type GameEra = 'garage' | 'scaleup' | 'national' | 'global' | 'empire';

export interface CompanyReputation {
  public: number;      // 0 - 100
  investors: number;   // 0 - 100
  employees: number;   // 0 - 100
  customers: number;   // 0 - 100
  esg: number;         // 0 - 100
}

export interface CeoTraits {
  ethical: number;     // 0 - 100
  ruthless: number;    // 0 - 100
  bold: number;        // 0 - 100
  secretive: number;   // 0 - 100
}

export interface DepartmentStats {
  budget: number;          // Budget per quarter
  level: number;           // 1 - 5
  effectiveness: number;   // 0 - 100
  headcount: number;
  activeStatus: string;
}

export interface Departments {
  product: DepartmentStats & { currentProduct: string; productQuality: number };
  marketing: DepartmentStats & { brandAwareness: number; activeCampaign: string };
  hr: DepartmentStats & { employeeMoral: number; talentTier: string };
  legal: DepartmentStats & { litigationRisk: number; auditProtection: number };
  rd: DepartmentStats & { techBreakthroughs: number; patentsCount: number };
}

export type DepartmentId = keyof Departments;

export type BrandCategory = 'tech' | 'finance' | 'retail' | 'auto' | 'media';

export type TalentSpecialty = 'engineering' | 'marketing' | 'finance' | 'rd' | 'legal';

export interface RegularStaff {
  id: string;
  name: string;
  specialty: TalentSpecialty;
  assignedDept: keyof Departments;
  tier: 'junior' | 'pleno' | 'senior' | 'lead';
  skillLevel: number;     // 1 - 10
  salary: number;         // Quarterly cost
  morale: number;         // 0 - 100
  hiredDay: number;
}

export interface KeyTalent {
  id: string;
  name: string;
  title: string;
  specialty: TalentSpecialty;
  avatarBadge: string;
  salary: number;         // Quarterly cost
  signingBonus: number;
  skillLevel: number;     // 1 - 10
  uniquePerk: {
    name: string;
    description: string;
    effectKey: string;
    effectValue: number;
  };
  assignedDept: keyof Departments;
  bio: string;
  isHired: boolean;
  morale: number;
  loyalty: number;        // 0 - 100
}

export interface TrainingProgram {
  id: string;
  name: string;
  targetSpecialty: TalentSpecialty | 'all';
  cost: number;
  durationDays: number;
  skillGain: number;
  moraleGain: number;
  description: string;
}

export interface HrChoice {
  id: string;
  label: string;
  description: string;
  cost: number;
  moraleDelta: number;
  reputationDelta: Partial<CompanyReputation>;
  outcomeText: string;
}

export interface HrEvent {
  id: string;
  title: string;
  type: 'strike' | 'salary_demand' | 'poaching' | 'burnout';
  urgency: 'low' | 'medium' | 'critical';
  description: string;
  targetDept?: keyof Departments;
  rivalInvolved?: string;
  choices: HrChoice[];
}

export interface RivalBrand {
  id: string;
  name: string;
  category: BrandCategory;
  parodyOf: string;
  tagline: string;
  marketCap: number;
  sharePrice: number;
  marketSharePercent: number;
  relationshipScore: number; // -100 (hostile war) to +100 (close ally)
  leaderName: string;
  leaderTitle: string;
  isAcquired?: boolean;
  activeDeal?: string | null;
  hostileTakeoverCost: number;
}

export interface NegotiationCharacter {
  id: string;
  name: string;
  title: string;
  company: string;
  brandId: string;
  avatarUrl?: string;
  avatarBadgeColor: string;
  personality: string;
  interests: string[];
  startingPatience: number;
  currentPatience: number;
  mood: 'furious' | 'skeptical' | 'neutral' | 'interested' | 'convinced' | 'cautious';
  dealStatus: 'idle' | 'talking' | 'accepted' | 'rejected' | 'walkout';
  activeContractProposal: {
    id: string;
    title: string;
    termsText: string;
    cashEffect: number;
    debtEffect: number;
    debtDaysExtension: number;
    equityEffect: number;
    revenueBoost: number;
    reputationEffect: number;
  } | null;
}

export interface DialogueMessage {
  id: string;
  sender: 'player' | 'character' | 'system';
  senderName: string;
  text: string;
  tacticUsed?: string;
  moodChange?: string;
  timestamp: string;
}

export interface CrisisChoice {
  id: string;
  label: string;
  description: string;
  traitBadge: string;
  requirements?: {
    minCash?: number;
    minReputation?: number;
    minLegalLevel?: number;
  };
  outcomes: {
    cashDelta: number;
    debtDelta: number;
    debtDaysDelta: number;
    reputationDeltas: Partial<CompanyReputation>;
    traitDeltas: Partial<CeoTraits>;
    stockPriceDelta: number;
    headline: string;
    narrativeResolution: string;
  };
}

export interface CrisisEvent {
  id: string;
  title: string;
  era: GameEra;
  urgency: 'low' | 'medium' | 'critical';
  sourceDept: 'legal' | 'hr' | 'product' | 'marketing' | 'rd' | 'board';
  description: string;
  flavorQuote: string;
  choices: CrisisChoice[];
}

export interface MembroConselho {
  nome: string;
  cargo: string;
  prioridade: 'lucro' | 'reputacao' | 'inovacao' | 'etica';
  satisfacaoIndividual: number; // 0 - 100
}

export interface ConselhoState {
  confianca: number; // 0 - 100
  trimestresConsecutivosCriticos: number;
  membros: MembroConselho[];
  ultimaVotacao: string | null;
}

export type GameEnding = 'ethical_visionary' | 'wall_street_shark' | 'phoenix_turnaround' | 'liquidation_collapse' | 'fired_by_board';

export interface NewsArticle {
  id: string;
  day: number;
  quarter: number;
  source: string;
  title: string;
  snippet: string;
  fullContent?: string;
  author?: string;
  category?: 'vantex' | 'rivals' | 'market' | 'scandal';
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'scandal';
  relatedBrand?: string;
  marketImpact?: string;
}

export interface StockPricePoint {
  day: number;
  price: number;
  event?: string;
}

export interface GameState {
  companyName: string;
  ceoName: string;
  era: GameEra;
  day: number;
  quarter: number;
  debtDeadlineDays: number; // Initially 90 days
  initialDebt: number;      // $500,000
  debt: number;             // Remaining debt
  cash: number;
  stockPrice: number;
  sharesTotal: number;
  playerSharesPercent: number; // starts at ~65%
  quarterlyRevenue: number;
  quarterlyExpenses: number;
  reputation: CompanyReputation;
  traits: CeoTraits;
  conselho: ConselhoState;
  scandalHeat: number;      // 0 - 100
  departments: Departments;
  rivals: Record<string, RivalBrand>;
  // Talent & HR System
  staffMembers: RegularStaff[];
  keyTalents: KeyTalent[];
  activeHrEvents: HrEvent[];
  activeTraining: {
    programId: string;
    programName: string;
    staffIds: string[];
    daysRemaining: number;
    totalDays: number;
    targetSpecialty?: TalentSpecialty | 'all';
    skillGain?: number;
    moraleGain?: number;
  } | null;
  // Crises & Narrative
  activeCrises: CrisisEvent[];
  resolvedCrisisHistory: { crisisId: string; choiceId: string; day: number }[];
  newsFeed: NewsArticle[];
  stockHistory: StockPricePoint[];
  activeNegotiation: {
    character: NegotiationCharacter | null;
    messages: DialogueMessage[];
  };
  isGameOver: boolean;
  ending: GameEnding | null;
  quarterHistory: {
    quarter: number;
    revenue: number;
    expenses: number;
    netProfit: number;
    endingCash: number;
    stockPrice: number;
  }[];
  launchedProducts?: ProductLaunchResult[];
}
