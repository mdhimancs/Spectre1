import React, { useState } from 'react';
import { Search, UserCheck, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Shield, Filter, Copy, Check } from 'lucide-react';
import { FootprintResponse, UsernameCheckResult } from '../types/osint';

interface FootprintSearchProps {
  onAddToGraph?: (username: string, results: FootprintResponse) => void;
}

export const FootprintSearch: React.FC<FootprintSearchProps> = ({ onAddToGraph }) => {
  const [usernameInput, setUsernameInput] = useState<string>('octocat');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [response, setResponse] = useState<FootprintResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) return;

    setIsSearching(true);
    setErrorMsg('');
    setResponse(null);

    try {
      const res = await fetch('/api/username/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });

      if (!res.ok) throw new Error('Username footprint check failed');
      const data: FootprintResponse = await res.json();
      setResponse(data);

      if (onAddToGraph) {
        onAddToGraph(data.username, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing username check');
    } finally {
      setIsSearching(false);
    }
  };

  const categories = response
    ? ['ALL', ...Array.from(new Set(response.results.map((r) => r.category)))]
    : ['ALL'];

  const filteredResults = response
    ? selectedCategory === 'ALL'
      ? response.results
      : response.results.filter((r) => r.category === selectedCategory)
    : [];

  const foundCount = response ? response.results.filter((r) => r.exists).length : 0;

  return (
    <div className="space-y-6">
      {/* Header & Input Bar */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-cyan-400" />
          <span>Cross-Platform Username Footprint Recon</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Scan over 20+ public developer platforms, social networks, forums, and security registries for active handle profiles.
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">@</span>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter handle or target username..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-7 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !usernameInput.trim()}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning 20+ Platforms...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Execute Handle Scan</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {/* Results View */}
      {response && (
        <div className="space-y-4">
          {/* Summary Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[11px] text-slate-400 font-mono">Target Handle</span>
              <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">@{response.username}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[11px] text-slate-400 font-mono">Platforms Checked</span>
              <p className="text-sm font-bold text-slate-200 font-mono mt-0.5">{response.totalChecked}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[11px] text-slate-400 font-mono">Accounts Detected</span>
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{foundCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[11px] text-slate-400 font-mono">Footprint Rate</span>
              <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {Math.round((foundCount / response.totalChecked) * 100)}%
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Platform Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredResults.map((item) => (
              <div
                key={item.name}
                className={`border rounded-lg p-3 flex items-center justify-between transition-colors ${
                  item.exists
                    ? 'border-emerald-500/40 bg-slate-900/90'
                    : 'border-slate-800 bg-slate-950/50 opacity-60'
                }`}
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    {item.exists ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-200 truncate">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono pl-5">
                    {item.category} · Status {item.statusCode}
                  </div>
                </div>

                {item.exists ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs flex items-center gap-1 font-medium transition-colors shrink-0"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">Unregistered</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
