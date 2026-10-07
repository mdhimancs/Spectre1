import React, { useState } from 'react';
import { Shield, Search, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { CertTransparencyResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

export const CertTransparency: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [domainInput, setDomainInput] = useState<string>('github.com');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [result, setResult] = useState<CertTransparencyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/cert/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });

      if (!res.ok) throw new Error('Certificate Transparency query failed');
      const data: CertTransparencyResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error querying CT Logs');
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
          <Shield className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Certificate Transparency Log Inspector (crt.sh)</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Search public SSL/TLS Certificate Transparency logs to discover all historical certificates, subdomains, and wildcard SAN entries issued for target domains.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter Target Domain (e.g. github.com)..."
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
                <span>Querying crt.sh CT Logs...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Query CT Logs</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.certificates?.map((c) => (
              <div key={c.id} className={`border p-3.5 rounded space-y-1.5 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between border-b pb-1 border-slate-200 dark:border-slate-800">
                  <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{c.commonName}</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ID: {c.id}</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Issuer: {c.issuer}</p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Logged: {c.loggedDate} · Expires: {c.notAfter}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
