import React, { useState } from 'react';
import { Database, ShieldAlert, Key, AlertTriangle, ExternalLink, RefreshCw, CheckCircle2, Search } from 'lucide-react';
import { BreachRecord } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface BreachIntelProps {
  onAddToGraph?: (target: string, breaches: BreachRecord[]) => void;
}

export const BreachIntel: React.FC<BreachIntelProps> = ({ onAddToGraph }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [targetInput, setTargetInput] = useState<string>('admin@shadow-corp.io');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [breaches, setBreaches] = useState<BreachRecord[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleBreachCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setBreaches(null);

    try {
      const res = await fetch('/api/breach/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetInput.trim() }),
      });

      if (!res.ok) throw new Error('Breach check failed');
      const data = await res.json();
      setBreaches(data.breaches || []);

      if (onAddToGraph && data.breaches) {
        onAddToGraph(targetInput.trim(), data.breaches);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing breach lookup');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Database className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Data Breach & Dark Web Leak Intelligence Engine</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Query historical database exposures, pastebin credential dumps, and compromised password records (HaveIBeenPwned & DarkWeb style).
        </p>

        <form onSubmit={handleBreachCheck} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Enter Target Email or Handle (e.g. user@target.com)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isSearching || !targetInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching Leak Databases...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Search Breaches</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {breaches && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 flex items-center justify-between font-mono text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Target: <strong className={isDark ? 'text-cyan-400' : 'text-cyan-800'}>{targetInput}</strong></span>
            <span className={`px-2.5 py-1 rounded font-bold border ${
              breaches.length > 0
                ? isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-800 border-red-200'
                : isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {breaches.length} BREACHES DETECTED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {breaches.map((b, idx) => (
              <div key={idx} className={`border rounded-lg p-4 space-y-2 font-mono text-xs ${
                isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
              }`}>
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                  <h3 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{b.name}</h3>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{b.breachDate}</span>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{b.description}</p>

                <div className="pt-2 flex flex-wrap gap-1">
                  {b.dataClasses?.map((c, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                    }`}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
