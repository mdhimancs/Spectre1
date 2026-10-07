import React, { useState } from 'react';
import { Archive, ExternalLink, RefreshCw, AlertTriangle, Search, Clock } from 'lucide-react';
import { WaybackSnapshot } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface WaybackIntelProps {
  onAddToGraph?: (domain: string, snapshots: WaybackSnapshot[]) => void;
  defaultDomain?: string;
}

export const WaybackIntel: React.FC<WaybackIntelProps> = ({ onAddToGraph, defaultDomain = 'github.com' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [domainInput, setDomainInput] = useState<string>(defaultDomain);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<WaybackSnapshot[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setSnapshots(null);

    try {
      const res = await fetch('/api/wayback/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });

      if (!res.ok) throw new Error('Wayback Machine search failed');
      const data = await res.json();
      setSnapshots(data.snapshots || []);

      if (onAddToGraph && data.snapshots) {
        onAddToGraph(data.domain, data.snapshots);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error querying Wayback Machine');
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
          <Archive className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Internet Archive Wayback CDX Historical Snapshot Explorer</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Discover deleted endpoints, historical admin portals, leaked JS source code files, and old website snapshots from the Wayback Machine.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter Target Domain (e.g. github.com or tesla.com)..."
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
                <span>Querying Archive CDX...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Search Historical CDX</span>
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

      {snapshots && (
        <div className="space-y-4 font-mono text-xs">
          <div className={`border rounded-lg p-4 flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Target: <strong className={isDark ? 'text-cyan-400' : 'text-cyan-800'}>{domainInput}</strong></span>
            <span className={`px-2.5 py-1 rounded font-bold border ${
              isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-900 border-cyan-200'
            }`}>
              {snapshots.length} HISTORICAL CDX SNAPSHOTS
            </span>
          </div>

          <div className="space-y-2">
            {snapshots.map((s, idx) => (
              <div key={idx} className={`border p-3.5 rounded flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-1 min-w-0 pr-2">
                  <a
                    href={s.archiveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`font-semibold hover:underline flex items-center gap-1 truncate ${
                      isDark ? 'text-cyan-400' : 'text-cyan-800'
                    }`}
                  >
                    <span className="truncate">{s.originalUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Captured: {s.timestamp} · Type: {s.mimeType} · Status {s.status}
                  </p>
                </div>

                <a
                  href={s.archiveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-1.5 border rounded text-xs flex items-center gap-1 font-medium whitespace-nowrap ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>View Snapshot</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
