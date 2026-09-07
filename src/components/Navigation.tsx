import React from 'react';
import { 
  LayoutDashboard, 
  Rocket,
  MessagesSquare, 
  Scale, 
  Briefcase, 
  LineChart, 
  Newspaper,
  Users
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type TabType = 'dashboard' | 'products' | 'negotiation' | 'crises' | 'departments' | 'talents' | 'market' | 'news';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasActiveCrisis: boolean;
  unreadNewsCount: number;
  activeHrEventsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  hasActiveCrisis,
  unreadNewsCount,
  activeHrEventsCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Sala de Comando', icon: LayoutDashboard },
    { id: 'products' as TabType, label: 'Estúdio de Produtos', icon: Rocket },
    { id: 'negotiation' as TabType, label: 'Negociações IA', icon: MessagesSquare },
    { id: 'crises' as TabType, label: 'Conselho & Crises', icon: Scale, badge: hasActiveCrisis ? '!' : null },
    { id: 'departments' as TabType, label: 'Departamentos', icon: Briefcase },
    { id: 'talents' as TabType, label: 'Talentos & RH', icon: Users, badge: activeHrEventsCount > 0 ? activeHrEventsCount : null },
    { id: 'market' as TabType, label: 'Bolsa & Rivais', icon: LineChart },
    { id: 'news' as TabType, label: 'TechPulse News', icon: Newspaper, badge: unreadNewsCount > 0 ? unreadNewsCount : null },
  ];

  return (
    <nav className="bg-[#14161C] border-b border-white/10 px-3 sm:px-6 sticky top-[65px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                onSelectTab(tab.id);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white/5 border border-white/10 text-orange-500 shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-white/40'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  tab.id === 'crises' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' 
                    : tab.id === 'talents'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                    : 'bg-white/10 text-orange-400 border border-white/10'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

