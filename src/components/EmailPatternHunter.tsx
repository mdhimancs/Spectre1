import React, { useState } from 'react';
import { Mail, Search, RefreshCw, AlertTriangle, UserCheck, ShieldCheck } from 'lucide-react';
import { EmailPatternResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface EmailPatternHunterProps {
  onAddToGraph?: (domain: string, result: EmailPatternResult) => void;
  defaultDomain?: string;
}

export const EmailPatternHunter: React.FC<EmailPatternHunterProps> = ({ onAddToGraph, defaultDomain = 'shadow-corp.io' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [domainInput, setDomainInput] = useState<string>(defaultDomain);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [result, setResult] = useState<EmailPatternResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/email/hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });

      if (!res.ok) throw new Error('Email pattern lookup failed');
      const data: EmailPatternResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.domain, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error searching email pattern');
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
          <Mail className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Corporate Email Pattern & Employee Directory Hunter (Hunter.io Style)</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Discover corporate email naming conventions (e.g. &#123;first&#125;.&#123;last&#125;@company.com) and enumerate verified employee directories.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter Corporate Domain (e.g. company.com)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isSearching || !domainInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Hunting Directory...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Hunt Corporate Directory</span>
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

      {result && (
        <div className="space-y-4 font-mono text-xs">
          <div className={`border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <div>
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Naming Convention Pattern</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{result.pattern}</h3>
            </div>

            <div className="text-right">
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Pattern Confidence</span>
              <div className="text-2xl font-bold text-emerald-600">
                {result.confidence}% CONFIDENCE
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.emailsFound?.map((e, idx) => (
              <div key={idx} className={`border p-3.5 rounded flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-0.5">
                  <span className={`font-bold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{e.name}</span>
                  <span className={`text-[11px] block ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{e.email}</span>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{e.position}</span>
                </div>

                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] shrink-0">
                  {e.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
