import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, AlertOctagon, RefreshCw, AlertTriangle, ExternalLink, Globe, FileCode } from 'lucide-react';
import { DnsRecordResult, HeaderAnalysisResult } from '../types/osint';

interface DomainDnsIntelProps {
  onAddToGraph?: (domain: string, dnsData: DnsRecordResult, headerData: HeaderAnalysisResult) => void;
  defaultDomain?: string;
}

export const DomainDnsIntel: React.FC<DomainDnsIntelProps> = ({ onAddToGraph, defaultDomain = 'github.com' }) => {
  const [domainInput, setDomainInput] = useState<string>(defaultDomain);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dnsResult, setDnsResult] = useState<DnsRecordResult | null>(null);
  const [headerResult, setHeaderResult] = useState<HeaderAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleInspect = async (target: string) => {
    if (!target.trim()) return;
    const cleanDomain = target.replace(/^https?:\/\//, '').split('/')[0].trim();

    setIsLoading(true);
    setErrorMsg('');
    setDnsResult(null);
    setHeaderResult(null);

    try {
      // Parallel fetch for DNS and Header analysis
      const [dnsRes, headerRes] = await Promise.all([
        fetch('/api/dns/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: cleanDomain }),
        }),
        fetch('/api/headers/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: cleanDomain }),
        }),
      ]);

      let dnsData: DnsRecordResult | null = null;
      let headerData: HeaderAnalysisResult | null = null;

      if (dnsRes.ok) dnsData = await dnsRes.json();
      if (headerRes.ok) headerData = await headerRes.json();

      setDnsResult(dnsData);
      setHeaderResult(headerData);

      if (onAddToGraph && dnsData && headerData) {
        onAddToGraph(cleanDomain, dnsData, headerData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inspecting domain DNS & headers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleInspect(defaultDomain);
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Domain Infrastructure, DNS & HTTP Security Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Perform live Node.js DNS resolution (A, AAAA, MX, TXT/SPF, NS, SOA, CNAME) and verify HTTP security headers & SSL grade.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); handleInspect(domainInput); }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="Enter target domain (e.g. tesla.com, github.com)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={isLoading || !domainInput.trim()}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Querying Live DNS...</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Inspect Domain</span>
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

      {/* Header Analysis Grade */}
      {headerResult && (
        <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">HTTP Security Posture</span>
              <h3 className="text-base font-bold text-slate-100 font-mono mt-0.5">{headerResult.url}</h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Server: {headerResult.server} · Response Time: {headerResult.responseTimeMs}ms · Powered By: {headerResult.poweredBy}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block uppercase">Security Grade</span>
                <span
                  className={`text-2xl font-bold font-mono ${
                    headerResult.grade.startsWith('A')
                      ? 'text-emerald-400'
                      : headerResult.grade === 'B' || headerResult.grade === 'C'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  GRADE {headerResult.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Security Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {headerResult.securityChecklist.map((item) => (
              <div
                key={item.header}
                className={`border rounded-lg p-3 space-y-1 ${
                  item.present
                    ? 'border-emerald-500/30 bg-slate-950/60'
                    : 'border-red-500/30 bg-red-950/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      item.present ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {item.present ? 'PRESENT' : 'MISSING'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate">{item.value}</p>
                <p className="text-[10px] text-slate-500">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DNS Records View */}
      {dnsResult && (
        <div className="border border-slate-800 bg-slate-900/80 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Live Authoritative DNS Records</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">{dnsResult.timestamp}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A Records */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
              <span className="text-xs font-semibold text-cyan-400 font-mono uppercase">A Records (IPv4)</span>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                {dnsResult.records.A?.length ? (
                  dnsResult.records.A.map((ip, idx) => (
                    <div key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800">{ip}</div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No A records returned</span>
                )}
              </div>
            </div>

            {/* AAAA Records */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
              <span className="text-xs font-semibold text-cyan-400 font-mono uppercase">AAAA Records (IPv6)</span>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                {dnsResult.records.AAAA?.length ? (
                  dnsResult.records.AAAA.map((ip, idx) => (
                    <div key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">{ip}</div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No AAAA records returned</span>
                )}
              </div>
            </div>

            {/* MX Records */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
              <span className="text-xs font-semibold text-amber-400 font-mono uppercase">MX Mail Exchange Records</span>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                {dnsResult.records.MX?.length ? (
                  dnsResult.records.MX.map((mx, idx) => (
                    <div key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                      <span className="truncate pr-2">{mx.exchange}</span>
                      <span className="text-slate-500">Prio: {mx.priority}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No MX records returned</span>
                )}
              </div>
            </div>

            {/* TXT Records (SPF / DMARC / Verification) */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
              <span className="text-xs font-semibold text-emerald-400 font-mono uppercase">TXT / SPF / Domain Keys</span>
              <div className="space-y-1 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto pr-1">
                {dnsResult.records.TXT?.length ? (
                  dnsResult.records.TXT.map((txtArr, idx) => (
                    <div key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 break-all text-[11px]">
                      {txtArr.join('')}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No TXT records returned</span>
                )}
              </div>
            </div>

            {/* NS Records */}
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2 md:col-span-2">
              <span className="text-xs font-semibold text-cyan-400 font-mono uppercase">NS Nameservers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-slate-300">
                {dnsResult.records.NS?.length ? (
                  dnsResult.records.NS.map((ns, idx) => (
                    <div key={idx} className="bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">{ns}</div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No NS records returned</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
