import React, { useState, useEffect } from 'react';
import { Globe, Shield, Calendar, RefreshCw, AlertTriangle, ExternalLink, Layers, Server } from 'lucide-react';
import { WhoisRecordResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface WhoisLookupProps {
  onAddToGraph?: (domain: string, whois: WhoisRecordResult) => void;
  defaultDomain?: string;
}

export const WhoisLookup: React.FC<WhoisLookupProps> = ({ onAddToGraph, defaultDomain = 'github.com' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [domainInput, setDomainInput] = useState<string>(defaultDomain);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<WhoisRecordResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleLookup = async (target: string) => {
    if (!target.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/whois/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: target.trim() }),
      });

      if (!res.ok) throw new Error('WHOIS lookup failed');
      const data: WhoisRecordResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.domain, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error looking up WHOIS data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleLookup(defaultDomain);
  }, []);

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Globe className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Historical WHOIS Registrar & Reverse IP Co-Hosting Inspector</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Retrieve domain registration history, registrar entity, expiration dates, privacy shield status, and co-hosted neighbor domains.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleLookup(domainInput); }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter target domain (e.g. github.com, tesla.com)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || !domainInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying WHOIS...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Inspect WHOIS</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Registrar Specs */}
          <div className={`border rounded-lg p-5 space-y-3 font-mono text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider border-b pb-2 ${
              isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'
            }`}>
              Domain Registrar Parameters
            </h3>

            <div className="space-y-2">
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Domain Name</span>
                <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{result.domain}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Registrar Entity</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{result.registrar}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Creation Date</span>
                <span className="text-emerald-600 font-semibold">{result.createdDate}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Expiration Date</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{result.expiresDate}</span>
              </div>
              <div className={`flex justify-between py-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Registrant Country</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{result.registrantCountry}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Whois Privacy Shield</span>
                <span className={result.privacyShield ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {result.privacyShield ? 'ENABLED (PRIVACY GUARD)' : 'EXPOSED REGISTRANT'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Co-Hosted Domains */}
          <div className={`border rounded-lg p-5 space-y-3 font-mono text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'
            }`}>
              <Server className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span>Reverse IP Co-Hosted Neighbor Domains</span>
            </h3>

            <div className="space-y-2">
              {result.coHostedDomains?.map((d, idx) => (
                <div key={idx} className={`border p-2.5 rounded flex items-center justify-between ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{d}</span>
                  <a
                    href={`https://${d}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-[11px] hover:underline flex items-center gap-1 ${
                      isDark ? 'text-cyan-400' : 'text-cyan-800'
                    }`}
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
