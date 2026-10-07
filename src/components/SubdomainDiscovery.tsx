import React, { useState } from 'react';
import { Network, RefreshCw, AlertTriangle, Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { SubdomainEnumResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface SubdomainDiscoveryProps {
  onAddToGraph?: (domain: string, result: SubdomainEnumResult) => void;
  defaultDomain?: string;
}

export const SubdomainDiscovery: React.FC<SubdomainDiscoveryProps> = ({ onAddToGraph, defaultDomain = 'github.com' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [domainInput, setDomainInput] = useState<string>(defaultDomain);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [result, setResult] = useState<SubdomainEnumResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/subdomain/enum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });

      if (!res.ok) throw new Error('Subdomain enumeration failed');
      const data: SubdomainEnumResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.domain, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enumerating subdomains');
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
          <Network className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Subdomain Discovery & Wildcard Enumeration Engine (Subfinder / Amass Style)</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Enumerate active subdomains, internal staging servers, VPN portals, and API gateway endpoints across target root domains.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter Root Domain (e.g. github.com, tesla.com)..."
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
                <span>Enumerating Subdomains...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Discover Subdomains</span>
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
          <div className={`border rounded-lg p-4 flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Root Domain: <strong className={isDark ? 'text-cyan-400' : 'text-cyan-800'}>{result.domain}</strong></span>
            <span className={`px-2.5 py-1 rounded font-bold border ${
              isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-900 border-cyan-200'
            }`}>
              {result.totalFound} ACTIVE SUBDOMAINS DISCOVERED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.subdomains?.map((s, idx) => (
              <div key={idx} className={`border p-3.5 rounded flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-0.5 min-w-0 pr-2">
                  <a
                    href={`https://${s.subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`font-semibold hover:underline flex items-center gap-1 truncate ${
                      isDark ? 'text-cyan-400' : 'text-cyan-800'
                    }`}
                  >
                    <span className="truncate">{s.subdomain}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    IP: {s.ip} · Server: {s.server}
                  </p>
                </div>

                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] shrink-0">
                  HTTP {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
