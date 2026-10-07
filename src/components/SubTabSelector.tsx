import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface SubTabItem {
  id: string;
  label: string;
  count?: number | string;
}

interface SubTabSelectorProps {
  items: SubTabItem[];
  activeSubTab: string;
  onSelectSubTab: (id: string) => void;
}

export const SubTabSelector: React.FC<SubTabSelectorProps> = ({
  items,
  activeSubTab,
  onSelectSubTab,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!items || items.length <= 1) return null;

  return (
    <div
      className={`p-1 rounded-lg border mb-3.5 flex flex-wrap items-center gap-1 font-mono text-[11px] ${
        isDark
          ? 'bg-slate-900/90 border-slate-800/90 shadow-inner'
          : 'bg-slate-100/80 border-slate-200/90 shadow-2xs'
      }`}
    >
      {items.map((item) => {
        const isActive = activeSubTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectSubTab(item.id)}
            className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              isActive
                ? isDark
                  ? 'bg-cyan-500 text-slate-950 shadow-xs font-extrabold'
                  : 'bg-cyan-800 text-white shadow-xs font-extrabold'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`px-1 py-0.2 text-[9px] rounded-full font-mono font-normal ${
                  isActive
                    ? isDark
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
