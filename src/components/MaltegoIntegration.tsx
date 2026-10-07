import React, { useState } from 'react';
import { Network, Download, Upload, RefreshCw, CheckCircle2, ShieldAlert, FileCode } from 'lucide-react';
import { InvestigationCase, LinkNode } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface MaltegoIntegrationProps {
  activeCase: InvestigationCase;
  onImportNodes: (nodes: LinkNode[]) => void;
}

export const MaltegoIntegration: React.FC<MaltegoIntegrationProps> = ({ activeCase, onImportNodes }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [importNotice, setImportNotice] = useState<string>('');

  const handleExportMaltego = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/maltego/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: activeCase.nodes }),
      });

      if (!res.ok) throw new Error('Maltego transform export failed');
      const data = await res.json();
      setCsvPreview(data.csvData || '');

      // Download CSV
      const blob = new Blob([data.csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCase.caseName.replace(/\s+/g, '_')}_MALTEGO_TRANSFORM.csv`;
      a.click();
    } catch (e: any) {
      console.error('Maltego export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const imported: LinkNode[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0) return; // skip header
        const parts = line.split(',').map((p) => p.replace(/"/g, '').trim());
        if (parts.length >= 2 && parts[1]) {
          let type: LinkNode['type'] = 'DOMAIN';
          if (parts[0].includes('IPv4') || parts[0].includes('IP')) type = 'IP';
          else if (parts[0].includes('Email')) type = 'EMAIL';
          else if (parts[0].includes('Persona') || parts[0].includes('User')) type = 'USERNAME';

          imported.push({
            id: `maltego-${Date.now()}-${idx}`,
            label: parts[1],
            type,
            details: `Imported from Maltego Transform CSV`,
          });
        }
      });

      if (imported.length > 0) {
        onImportNodes(imported);
        setImportNotice(`Successfully imported ${imported.length} Maltego entity nodes into your Link Graph!`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className={`border rounded-lg p-5 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <Network className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
          <span>Maltego Entity Transform Studio & Graph Exporter</span>
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Seamlessly export SPECTRE WATCH entity nodes into Maltego MTZX entity format or import Maltego transform CSV files directly into the interactive graph.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Panel */}
          <div className={`border p-4 rounded-lg space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider font-mono ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              1. Export Case to Maltego Format
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Converts active case nodes ({activeCase.nodes.length} entities) into Maltego-compatible entity CSV format (`maltego.Domain`, `maltego.IPv4Address`, `maltego.EmailAddress`).
            </p>

            <button
              onClick={handleExportMaltego}
              disabled={isExporting}
              className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  : 'bg-cyan-800 hover:bg-cyan-900 text-white'
              }`}
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export Maltego Entity CSV</span>
            </button>
          </div>

          {/* Import Panel */}
          <div className={`border p-4 rounded-lg space-y-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider font-mono ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              2. Import Maltego Entity File
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Upload a Maltego Transform entity export file to map external nodes directly into SPECTRE WATCH.
            </p>

            <label className={`inline-flex items-center gap-2 px-4 py-2 border rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}>
              <Upload className="w-4 h-4 text-cyan-700" />
              <span>Upload Maltego CSV File</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            {importNotice && (
              <p className="text-xs text-emerald-600 font-mono mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{importNotice}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {csvPreview && (
        <div className={`border rounded-lg p-4 space-y-2 font-mono text-xs ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
        }`}>
          <span className={`text-[10px] uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Maltego Transform Preview</span>
          <textarea
            readOnly
            rows={6}
            value={csvPreview}
            className={`w-full border rounded p-2.5 text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>
      )}
    </div>
  );
};
