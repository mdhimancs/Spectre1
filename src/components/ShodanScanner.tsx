import React, { useState } from 'react';
import { ShieldAlert, Server, Cpu, Key, AlertTriangle, ExternalLink, RefreshCw, Layers, Lock } from 'lucide-react';
import { ShodanScanResult } from '../types/osint';

interface ShodanScannerProps {
  onAddToGraph?: (ip: string, result: ShodanScanResult) => void;
  defaultIp?: string;
}

export const ShodanScanner: React.FC<ShodanScannerProps> = ({ onAddToGraph, defaultIp = '1.1.1.1' }) => {
  const [targetIpInput, setTargetIpInput] = useState<string>(defaultIp);
  const [shodanApiKey, setShodanApiKey] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ShodanScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleShodanScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetIpInput.trim()) return;

    setIsScanning(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const res = await fetch('/api/shodan/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: targetIpInput.trim(),
          apiKey: shodanApiKey.trim(),
        }),
      });

      if (!res.ok) throw new Error('Shodan threat surface scan failed');
      const data: ShodanScanResult = await res.json();
      setScanResult(data);

      if (onAddToGraph) {
        onAddToGraph(data.ip, data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Shodan scan error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & API Key Bar */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>Shodan / Censys Threat Surface & CVE Vulnerability Scanner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Inspect open service banners, active SSH/TLS protocols, and CVE vulnerability exposure across target host infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="password"
              placeholder="Optional Shodan API Key..."
              value={shodanApiKey}
              onChange={(e) => setShodanApiKey(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-cyan-300 font-mono w-48 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <form onSubmit={handleShodanScan} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={targetIpInput}
            onChange={(e) => setTargetIpInput(e.target.value)}
            placeholder="Enter Target IP or Hostname (e.g. 1.1.1.1 or cloudflare.com)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={isScanning || !targetIpInput.trim()}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Host Ports & Banners...</span>
              </>
            ) : (
              <>
                <Server className="w-3.5 h-3.5" />
                <span>Execute Shodan Scan</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {scanResult && (
        <div className="space-y-4">
          {/* Host Summary */}
          <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Target Host Matrix</span>
              <h3 className="text-base font-bold text-slate-100 font-mono mt-0.5">{scanResult.ip}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                OS: {scanResult.os || 'Linux'} · Hostnames: {scanResult.hostnames.join(', ') || 'None'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-500 block uppercase">CVE Vulnerability Count</span>
              <span className={`text-2xl font-bold font-mono ${scanResult.vulnerabilityCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {scanResult.vulnerabilityCount} VULNS
              </span>
            </div>
          </div>

          {/* Open Ports & Banners */}
          <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Detected Service Ports & Service Banners</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scanResult.ports.map((p, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-cyan-400 font-bold">PORT {p.port} / {p.transport.toUpperCase()}</span>
                    <span className="text-slate-300">{p.service}</span>
                  </div>
                  {p.banner && (
                    <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800 truncate">
                      {p.banner}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CVE Vulnerabilities List */}
          {scanResult.cveList?.length > 0 && (
            <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-3">
              <h4 className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Known CVE Vulnerabilities & CVSS Scores</span>
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {scanResult.cveList.map((cve) => (
                  <div key={cve.id} className="bg-slate-950 border border-slate-800 p-3 rounded flex items-start justify-between gap-3">
                    <div>
                      <span className="text-red-400 font-bold text-xs block">{cve.id}</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">{cve.summary}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold shrink-0">
                      CVSS {cve.cvss}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
