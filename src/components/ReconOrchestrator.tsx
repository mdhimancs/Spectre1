import React, { useState } from 'react';
import { Play, RefreshCw, CheckCircle2, AlertTriangle, Layers, Cpu, ShieldAlert, Network, Server, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ReconOrchestrator: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [seedTarget, setSeedTarget] = useState<string>('shadow-corp.io');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [modules, setModules] = useState<any[]>([
    { name: 'DNS Authoritative Resolution', status: 'PENDING', detail: 'A, AAAA, MX, TXT records' },
    { name: 'Shodan / Censys Host Scan', status: 'PENDING', detail: 'Open ports & CVE vulnerability scan' },
    { name: 'Cross-Platform Footprint Search', status: 'PENDING', detail: '20+ Social & Code registries' },
    { name: 'Wayback Archive CDX Crawl', status: 'PENDING', detail: 'Historical deleted snapshots' },
    { name: 'Dark Web Breach Lookup', status: 'PENDING', detail: 'Exposed credential databases' },
    { name: 'VirusTotal Security Vendor Scan', status: 'PENDING', detail: 'Malware & Phishing verdict' },
  ]);

  const handleStartOrchestrator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedTarget.trim()) return;

    setIsRunning(true);
    setProgressStep(0);

    // Reset module statuses
    setModules((prev) => prev.map((m) => ({ ...m, status: 'PENDING' })));

    // Sequential simulation of multi-module automated pipeline
    for (let i = 0; i < modules.length; i++) {
      setProgressStep(i + 1);
      setModules((prev) =>
        prev.map((m, idx) => (idx === i ? { ...m, status: 'RUNNING' } : m))
      );

      await new Promise((resolve) => setTimeout(resolve, 800));

      setModules((prev) =>
        prev.map((m, idx) => (idx === i ? { ...m, status: 'COMPLETED' } : m))
      );
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Play className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Automated 1-Click Recon Suite (SpiderFoot / Recon-ng Style)</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Enter a single seed domain or username to automatically trigger all 6 core OSINT modules concurrently and map target exposure.
        </p>

        <form onSubmit={handleStartOrchestrator} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={seedTarget}
            onChange={(e) => setSeedTarget(e.target.value)}
            placeholder="Enter Seed Target Domain or Username (e.g. shadow-corp.io)..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isRunning || !seedTarget.trim()}
            className={`px-6 py-2 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline ({progressStep}/6)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Launch Full 1-Click Recon</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
        {modules.map((m, idx) => (
          <div key={idx} className={`border p-4 rounded-lg space-y-2 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{m.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                m.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : m.status === 'RUNNING'
                  ? 'bg-cyan-100 text-cyan-800 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {m.status}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
