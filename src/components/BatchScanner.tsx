import React, { useState } from 'react';
import { Layers, RefreshCw, AlertTriangle, Download, CheckCircle2, Play } from 'lucide-react';
import { BatchItemResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

export const BatchScanner: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [inputList, setInputList] = useState<string>(
    `github.com\n1.1.1.1\ntesla.com\nadmin@shadow-corp.io\n8.8.8.8`
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [results, setResults] = useState<BatchItemResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleRunBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const targets = inputList
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (targets.length === 0) return;

    setIsScanning(true);
    setErrorMsg('');
    setResults(null);

    try {
      const res = await fetch('/api/batch/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });

      if (!res.ok) throw new Error('Batch scan failed');
      const data = await res.json();
      setResults(data.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing batch scan');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportCsv = () => {
    if (!results) return;
    const header = 'Target,Type,Status,Summary,RiskScore\n';
    const rows = results.map((r) => `"${r.target}","${r.type}","${r.status}","${r.summary}",${r.riskScore}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SPECTRE_BATCH_SCAN_RESULTS.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Layers className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Bulk Target Concurrent Batch Scanner</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Upload or paste a newline-separated batch list of up to 50 domains, IP addresses, or emails for multi-threaded parallel OSINT reconnaissance.
        </p>

        <form onSubmit={handleRunBatch} className="mt-4 space-y-3">
          <textarea
            rows={5}
            value={inputList}
            onChange={(e) => setInputList(e.target.value)}
            placeholder="Paste target list (one domain/IP/email per line)..."
            className={`w-full border rounded-md p-3 text-xs font-mono focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
            }`}
          />

          <div className="flex justify-between items-center">
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Targets: {inputList.split('\n').filter((t) => t.trim().length > 0).length}
            </span>

            <button
              type="submit"
              disabled={isScanning || !inputList.trim()}
              className={`px-5 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  : 'bg-cyan-800 hover:bg-cyan-900 text-white'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Batch Parallel...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Bulk Scan</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>

      {results && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-xs font-semibold font-mono uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Batch Scan Results ({results.length} Completed)
            </h3>
            <button
              onClick={handleExportCsv}
              className={`px-3 py-1.5 border rounded text-xs font-mono flex items-center gap-1.5 transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {results.map((r, idx) => (
              <div key={idx} className={`border p-3 rounded flex items-center justify-between ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>{r.target}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}>
                      {r.type}
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{r.summary}</p>
                </div>

                <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                  r.riskScore > 30 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  SCORE {r.riskScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
