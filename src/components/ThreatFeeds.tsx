import React, { useState, useEffect } from 'react';
import { Activity, Radio, AlertTriangle, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ThreatFeeds: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feeds, setFeeds] = useState<any[]>([]);

  const fetchFeeds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/threat-feeds/get');
      if (res.ok) {
        const data = await res.json();
        setFeeds(data.feeds || []);
      }
    } catch (e) {
      console.error('Threat feed fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Activity className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span>Real-Time Global Threat Intelligence Ticker & IOC Feed</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Live malicious IP, domain, and CVE Indicator of Compromise (IOC) pulses aggregated from CISA KEV, AlienVault OTX, AbuseIPDB, and MalwareBazaar.
            </p>
          </div>

          <button
            onClick={fetchFeeds}
            disabled={isLoading}
            className={`px-3 py-1.5 border rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        <div className="mt-4 space-y-3 font-mono text-xs">
          {feeds.map((item) => (
            <div key={item.id} className={`border p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.severity}
                  </span>
                  <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{item.ioc}</span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({item.category})</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Source: {item.source} · Target Sector: {item.target}
                </p>
              </div>

              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
