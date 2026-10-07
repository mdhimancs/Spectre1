import React, { useState } from 'react';
import { FileSpreadsheet, X, Cpu, ShieldAlert, CheckCircle2, Download, Printer, RefreshCw, AlertTriangle } from 'lucide-react';
import { InvestigationCase } from '../types/osint';

interface DossierReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: InvestigationCase;
  onUpdateCase: (updated: InvestigationCase) => void;
}

export const DossierReportModal: React.FC<DossierReportModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  onUpdateCase,
}) => {
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerateDossier = async () => {
    setIsSynthesizing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/osint/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: activeCase.targetName,
          targetType: activeCase.targetType,
          inputs: {
            nodes: activeCase.nodes,
            dorkResults: activeCase.dorkResults,
            ipResults: activeCase.ipResults,
            dnsResults: activeCase.dnsResults,
            usernameResults: activeCase.usernameResults,
            exifResults: activeCase.exifResults,
          },
        }),
      });

      if (!res.ok) throw new Error('OSINT dossier synthesis failed');
      const data = await res.json();

      const updatedCase: InvestigationCase = {
        ...activeCase,
        aiDossier: data.dossier,
        updatedAt: new Date().toISOString(),
      };

      onUpdateCase(updatedCase);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating AI dossier');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeCase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeCase.caseName.replace(/\s+/g, '_')}_SPECTRE_DOSSIER.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const dossier = activeCase.aiDossier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono">{activeCase.caseName}</h2>
              <span className="text-xs text-slate-400 font-mono">Target: {activeCase.targetName} ({activeCase.targetType})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 font-mono transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!dossier ? (
            <div className="text-center py-12 space-y-4">
              <Cpu className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
              <div>
                <h3 className="text-base font-bold text-slate-200">No Intelligence Dossier Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Synthesize collected Google Dorks, IP geolocation, DNS records, and footprint nodes into an executive OSINT intelligence report via Gemini AI.
                </p>
              </div>

              <button
                onClick={handleGenerateDossier}
                disabled={isSynthesizing}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md shadow-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Dossier via Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Generate AI Executive Dossier</span>
                  </>
                )}
              </button>

              {errorMsg && (
                <p className="text-xs text-red-400 mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score & Summary Banner */}
              <div className="border border-slate-800 bg-slate-950 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Executive Threat Assessment</span>
                  <h3 className="text-xl font-bold text-slate-100 font-mono mt-0.5">{activeCase.targetName}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Composite Risk Score</span>
                    <span className={`text-3xl font-bold font-mono ${dossier.threatScore >= 70 ? 'text-red-400' : 'text-amber-400'}`}>
                      {dossier.threatScore} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Executive Intelligence Brief
                </h4>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 leading-relaxed font-sans">
                  {dossier.executiveSummary}
                </div>
              </div>

              {/* Key Findings */}
              {dossier.keyFindings?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Key Salient Findings</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-5 text-xs text-slate-300 font-mono">
                    {dossier.keyFindings.map((finding: string, idx: number) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vulnerabilities */}
              {dossier.vulnerabilities?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Identified Exposure Vectors & Remediations</span>
                  </h4>
                  <div className="space-y-2">
                    {dossier.vulnerabilities.map((vuln: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{vuln.title}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${vuln.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{vuln.description}</p>
                        <p className="text-[11px] font-mono text-cyan-300/90 pt-1">Remediation: {vuln.remediation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
