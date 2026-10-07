import React, { useState } from 'react';
import { ShieldCheck, Bug, AlertOctagon, RefreshCw, AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { VirusTotalResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface VirusTotalScannerProps {
  onAddToGraph?: (target: string, vtResult: VirusTotalResult) => void;
  defaultTarget?: string;
}

export const VirusTotalScanner: React.FC<VirusTotalScannerProps> = ({ onAddToGraph, defaultTarget = 'shadow-corp.io' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [targetInput, setTargetInput] = useState<string>(defaultTarget);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<VirusTotalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetInput.trim()) return;

    setIsScanning(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/virustotal/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetInput.trim() }),
      });

      if (!res.ok) throw new Error('VirusTotal scan failed');
      const data: VirusTotalResult = await res.json();
      setResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.target, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing VirusTotal scan');
    } flex: {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Bug className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>VirusTotal Vendor Malware & Phishing Intelligence Scanner</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Analyze target URLs, domain reputations, or SHA256 file hashes across 70+ top security vendors (Kaspersky, Sophos, CrowdStrike, SentinelOne).
        </p>

        <form onSubmit={handleScan} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="Enter Target URL, Domain, or SHA256 Hash..."
            className={`flex-1 border rounded-md px-3 py-2 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <button
            type="submit"
            disabled={isScanning || !targetInput.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-cyan-800 hover:bg-cyan-900 text-white'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning 70+ Vendors...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Scan VirusTotal</span>
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
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Target Payload</span>
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.target}</h3>
              {result.sslCertSha256 && (
                <p className={`text-[11px] truncate max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  SSL SHA256: {result.sslCertSha256}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Malicious Detections</span>
              <div className={`text-2xl font-bold ${
                result.maliciousCount > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {result.maliciousCount} / {result.totalVendors} VENDORS
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {result.vendorDetections?.map((v, idx) => (
              <div key={idx} className={`border p-3 rounded flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>{v.vendor}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  v.category === 'malicious' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {v.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
