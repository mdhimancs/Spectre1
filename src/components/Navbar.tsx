import React from 'react';
import { 
  Shield, 
  FileSpreadsheet, 
  PlusCircle, 
  Key, 
  Sun, 
  Moon, 
  Search, 
  Globe, 
  ShieldAlert, 
  UserCheck, 
  Network,
  FolderLock,
  ListCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeHub: string;
  setActiveHub: (hub: string) => void;
  onNewCase: () => void;
  onOpenDossier: () => void;
  onOpenApiSettings: () => void;
  activeCaseName?: string;
  trackedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeHub,
  setActiveHub,
  onNewCase,
  onOpenDossier,
  onOpenApiSettings,
  activeCaseName,
  trackedCount = 5,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const hubs = [
    {
      id: 'search',
      title: 'Search & Recon',
      subtitle: 'Dorks & Social',
      icon: Search,
    },
    {
      id: 'domain',
      title: 'Domain & Network',
      subtitle: 'WHOIS & DNS',
      icon: Globe,
    },
    {
      id: 'threats',
      title: 'Threat Surface',
      subtitle: 'Shodan & VT',
      icon: ShieldAlert,
    },
    {
      id: 'forensics',
      title: 'Identity & Forensics',
      subtitle: 'EXIF & Session Audit',
      icon: UserCheck,
    },
    {
      id: 'graph',
      title: 'Canvas & Maltego',
      subtitle: 'Node Graph Studio',
      icon: Network,
    },
    {
      id: 'tracker',
      title: 'Target Watch Matrix',
      subtitle: 'Tracked Assets',
      icon: ListCheck,
      badge: trackedCount,
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors ${
        isDark
          ? 'border-slate-800/80 bg-slate-950/95 text-slate-100 backdrop-blur-md'
          : 'border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md shadow-xs'
      }`}
    >
      {/* Row 1: Title Row & Primary Case Actions - Vertically Compact (py-1.5) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3 border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Brand Title - BOLD FONT SPECTRE WATCH */}
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveHub('search');
            }}
            className="flex items-center gap-2 font-mono tracking-tight group"
          >
            <div className={`p-1.5 rounded-lg border transition-all ${
              isDark 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400 group-hover:bg-cyan-500/20' 
                : 'bg-cyan-50 border-cyan-300 text-cyan-800 group-hover:bg-cyan-100'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-xl font-bold font-black font-mono uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                SPECTRE <span className={`font-bold font-black ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>WATCH</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                v3.2 Real-time
              </span>
            </div>
          </a>
        </div>

        {/* Action Controls & Active Case Display */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeCaseName && (
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <FolderLock className="w-3 h-3 text-cyan-500" />
              <span className="text-slate-500">Case:</span>
              <span className="font-bold max-w-[120px] truncate">{activeCaseName}</span>
            </div>
          )}

          <button
            onClick={() => setActiveHub('tracker')}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md border transition-all cursor-pointer ${
              activeHub === 'tracker'
                ? isDark
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-cyan-100 text-cyan-900 border-cyan-300'
                : isDark
                  ? 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Open Target Tracker Matrix"
          >
            <ListCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>Target Tracker</span>
            <span className="px-1 py-0.2 rounded-full text-[9px] bg-cyan-500/20 text-cyan-500 font-bold">
              {trackedCount}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:border-slate-700 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
          </button>

          <button
            onClick={onOpenApiSettings}
            className={`p-1.5 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-cyan-400 bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
            title="Configure Real API Keys"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onNewCase}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded-md border transition-all cursor-pointer whitespace-nowrap ${
              isDark
                ? 'text-slate-200 bg-slate-900 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                : 'text-slate-700 bg-slate-100 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-500" />
            <span>New Case</span>
          </button>

          <button
            onClick={onOpenDossier}
            className={`flex items-center gap-1 px-3 py-1 text-[11px] font-mono font-bold rounded-md transition-all cursor-pointer whitespace-nowrap shadow-xs ${
              isDark
                ? 'text-slate-950 bg-cyan-400 hover:bg-cyan-300'
                : 'text-white bg-cyan-800 hover:bg-cyan-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Dossier Report</span>
          </button>
        </div>
      </div>

      {/* Row 2: Deck of Cards Horizontal Selector Row - Vertically Compact (pt-1 pb-0) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-0">
        <div className="flex items-end gap-1.5 overflow-x-auto no-scrollbar">
          {hubs.map((hub) => {
            const isSelected = activeHub === hub.id;
            const Icon = hub.icon;

            return (
              <button
                key={hub.id}
                onClick={() => setActiveHub(hub.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all cursor-pointer whitespace-nowrap shrink-0 text-left ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-900 text-cyan-300 border-t border-l border-r border-slate-700 border-b-3 border-b-cyan-400 shadow-xs font-bold'
                      : 'bg-white text-cyan-900 border-t border-l border-r border-slate-300 border-b-3 border-b-cyan-700 shadow-2xs font-extrabold'
                    : isDark
                      ? 'bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:bg-slate-900/80 hover:text-slate-200 border-b-2 border-b-transparent'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:text-slate-900 border-b-2 border-b-transparent'
                }`}
              >
                <div
                  className={`p-1 rounded-md transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-cyan-100 text-cyan-800'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                        : 'bg-slate-200/80 text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div>
                  <div className="text-[11px] font-mono font-bold tracking-tight flex items-center gap-1">
                    <span>{hub.title}</span>
                    {hub.badge !== undefined && (
                      <span className="px-1 py-0.2 rounded-full text-[8px] bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                        {hub.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-sans opacity-70 font-normal">
                    {hub.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
