import React, { useState } from 'react';
import { Search, ExternalLink, ShieldAlert, FileCode, Layers, Cpu, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';
import { DorkItem, DorkAnalysisResult } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface DorkingStudioProps {
  onAddToGraph?: (dork: string, results: any) => void;
  targetDomainDefault?: string;
}

const PRESET_DORKS: DorkItem[] = [
  {
    id: 'dork-1',
    category: 'Cloud Storage',
    title: 'Exposed S3 & Cloud Buckets',
    query: 'site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com',
    description: 'Searches for publicly accessible cloud storage buckets containing sensitive user uploads.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-2',
    category: 'Credentials & Configs',
    title: '.env Files & Secret Keys',
    query: 'filetype:env OR filename:.env OR ext:yaml intext:"AWS_SECRET_ACCESS_KEY" OR intext:"DB_PASSWORD"',
    description: 'Finds exposed environment files containing API keys, database credentials, and secrets.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-3',
    category: 'Confidential Documents',
    title: 'Internal / Restricted PDF & XLSX',
    query: 'filetype:pdf OR filetype:xlsx OR filetype:docx intext:"confidential" OR intext:"not for distribution" OR intext:"internal use only"',
    description: 'Discovers sensitive internal documents leaked onto public web servers.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-4',
    category: 'Database Dumps',
    title: 'SQL Backups & Database Dumps',
    query: 'ext:sql OR ext:db OR ext:tar.gz intext:"INSERT INTO" OR intext:"dump" OR intext:"pg_dump"',
    description: 'Locates database export files and raw SQL dump scripts exposed in public web roots.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-5',
    category: 'Directory Listing',
    title: 'Open Directory Indexes',
    query: 'intitle:"index of /" OR intitle:"index of /admin" OR intitle:"index of /backup" OR intitle:"index of /private"',
    description: 'Identifies unindexed web directories allowing file listing and unauthenticated downloads.',
    targetRisk: 'MEDIUM',
  },
  {
    id: 'dork-6',
    category: 'Admin Portals',
    title: 'Exposed Admin Dashboards',
    query: 'inurl:admin OR inurl:login OR inurl:dashboard OR intitle:"Admin Login" OR intitle:"Dashboard Login"',
    description: 'Exposes administrative login interfaces and control portals.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-7',
    category: 'Financial & PII',
    title: 'Salary, SSN & Credit Card Records',
    query: 'filetype:xlsx OR filetype:csv intext:"SSN" OR intext:"Salary" OR intext:"Credit Card" OR intext:"Passport"',
    description: 'Searches for spreadsheets and CSV exports containing personally identifiable information.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-8',
    category: 'IoT & Webcams',
    title: 'Live Camera Streams & IoT',
    query: 'inurl:view/index.shtml OR intitle:"live view" OR inurl:"/mjpg/video.mjpg" OR intitle:"Network Camera"',
    description: 'Discovers unauthenticated IP security cameras and smart device interfaces.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-9',
    category: 'Vulnerable Parameters',
    title: 'SQLi & RFI Endpoint Candidates',
    query: 'inurl:php?id= OR inurl:index.php?page= OR inurl:article.php?id= OR inurl:api/v1/',
    description: 'Finds URL parameter patterns susceptible to SQL Injection or Remote File Inclusion.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-10',
    category: 'System Logs',
    title: 'Application & Server Error Logs',
    query: 'ext:log OR inurl:error_log OR intext:"fatal error" OR intext:"stack trace" OR intext:"uncaught exception"',
    description: 'Exposes raw log files revealing internal system paths, user IPs, and database queries.',
    targetRisk: 'MEDIUM',
  },
];

export const DorkingStudio: React.FC<DorkingStudioProps> = ({ onAddToGraph, targetDomainDefault = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [targetDomain, setTargetDomain] = useState<string>(targetDomainDefault);
  const [customQuery, setCustomQuery] = useState<string>('site:s3.amazonaws.com intext:"confidential"');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DorkAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const categories = ['ALL', ...Array.from(new Set(PRESET_DORKS.map((d) => d.category)))];

  const filteredDorks = selectedCategory === 'ALL'
    ? PRESET_DORKS
    : PRESET_DORKS.filter((d) => d.category === selectedCategory);

  const getFullQuery = (baseQuery: string) => {
    if (targetDomain.trim()) {
      const cleanDomain = targetDomain.trim().replace(/^https?:\/\//, '').split('/')[0];
      return `site:${cleanDomain} ${baseQuery.replace(/site:[^\s]+/g, '').trim()}`.trim();
    }
    return baseQuery;
  };

  const handleInsertOperator = (operator: string) => {
    setCustomQuery((prev) => `${prev} ${operator}`.trim());
  };

  const handleLaunchGoogle = (queryToLaunch: string) => {
    const full = getFullQuery(queryToLaunch);
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(full)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRunAiAnalysis = async (queryToAnalyze: string, categoryName: string = 'General OSINT') => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const fullQ = getFullQuery(queryToAnalyze);

    try {
      const res = await fetch('/api/dork/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dorkQuery: fullQ,
          category: categoryName,
          targetDomain: targetDomain.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to run AI dorking analysis');
      const data: DorkAnalysisResult = await res.json();
      setAnalysisResult(data);

      if (onAddToGraph && data.analysis) {
        onAddToGraph(fullQ, data);
      }
    } catch (err: any) {
      console.error('Dork analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`border rounded-lg p-5 transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <Search className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span>Google Dorking Recon Studio</span>
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Advanced Google search operator studio for discovering leaked databases, exposed credentials, cloud storage buckets, and unindexed portals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Target Domain (e.g. example.com)"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className={`border rounded-md px-3 py-1.5 text-xs font-mono w-60 focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
              }`}
            />
            {targetDomain && (
              <button
                onClick={() => setTargetDomain('')}
                className={`text-xs ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Dork Builder Bar */}
      <div className={`border rounded-lg p-4 space-y-3 ${
        isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <label className={`text-xs font-semibold uppercase tracking-wider font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Interactive Dork Query Builder
          </label>
          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Quick Operators:</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['site:', 'filetype:', 'inurl:', 'intitle:', 'intext:', 'ext:', 'cache:', 'OR', 'AND', '-site:'].map((op) => (
            <button
              key={op}
              onClick={() => handleInsertOperator(op)}
              className={`px-2 py-1 border rounded text-xs font-mono transition-colors ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-900 font-semibold'
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className={`w-full border rounded-md pl-3 pr-8 py-2 text-xs font-mono focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-cyan-300 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 font-semibold focus:border-cyan-700'
              }`}
              placeholder="Enter custom dork query..."
            />
            <button
              onClick={() => handleCopy(getFullQuery(customQuery))}
              className={`absolute right-2 top-2 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              title="Copy Query"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunchGoogle(customQuery)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <ExternalLink className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <span>Launch in Google</span>
            </button>

            <button
              onClick={() => handleRunAiAnalysis(customQuery, 'Custom Dork')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50 ${
                isDark
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  : 'bg-cyan-800 hover:bg-cyan-900 text-white'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Deep AI Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dork Presets & Category Tabs */}
      <div className="space-y-4">
        <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className={`text-xs font-mono shrink-0 mr-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? isDark
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-200 text-slate-900 border border-slate-300 font-semibold'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dork Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDorks.map((dork) => {
            const fullQ = getFullQuery(dork.query);
            return (
              <div
                key={dork.id}
                className={`border rounded-lg p-4 space-y-3 transition-colors flex flex-col justify-between ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{dork.title}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        dork.targetRisk === 'CRITICAL'
                          ? isDark ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-red-300 text-red-700 bg-red-50 font-semibold'
                          : dork.targetRisk === 'HIGH'
                          ? isDark ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-amber-300 text-amber-800 bg-amber-50 font-semibold'
                          : isDark ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-cyan-300 text-cyan-800 bg-cyan-50 font-semibold'
                      }`}
                    >
                      {dork.targetRisk}
                    </span>
                  </div>

                  <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{dork.description}</p>

                  <div className={`p-2.5 border rounded font-mono text-xs break-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-cyan-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800 font-medium'
                  }`}>
                    {fullQ}
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-2 border-t ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{dork.category}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLaunchGoogle(dork.query)}
                      className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>Google</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setCustomQuery(dork.query);
                        handleRunAiAnalysis(dork.query, dork.category);
                      }}
                      className={`px-2.5 py-1 border rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                        isDark
                          ? 'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-300'
                          : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-900 font-semibold'
                      }`}
                    >
                      <Cpu className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Dork Scan Analysis Results View */}
      {analysisResult && (
        <div className={`border rounded-lg p-5 space-y-4 shadow-xl ${
          isDark
            ? 'border-cyan-500/30 bg-slate-900/90 shadow-cyan-950/20'
            : 'border-cyan-300 bg-white shadow-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Cpu className={`w-5 h-5 animate-pulse ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>SPECTRE Dork Inspection Report</h3>
            </div>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded border font-semibold ${
                analysisResult.analysis.riskLevel === 'CRITICAL'
                  ? isDark ? 'border-red-500/50 text-red-400 bg-red-500/20' : 'border-red-300 text-red-800 bg-red-100'
                  : isDark ? 'border-amber-500/50 text-amber-400 bg-amber-500/20' : 'border-amber-300 text-amber-900 bg-amber-100'
              }`}
            >
              RISK: {analysisResult.analysis.riskLevel}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Query Technical Breakdown
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {analysisResult.analysis.queryExplanation}
              </p>
            </div>

            <div>
              <h4 className={`text-xs font-semibold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Potential Exploit & Vulnerability Impact
              </h4>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {analysisResult.analysis.potentialImpact}
              </p>
            </div>

            {/* Simulated Live Matches */}
            {analysisResult.analysis.simulatedLiveMatches?.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className={`text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Identified Leaked Endpoints & Matched Records</span>
                </h4>

                <div className="space-y-2">
                  {analysisResult.analysis.simulatedLiveMatches.map((match, idx) => (
                    <div key={idx} className={`border rounded p-3 space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <a
                          href={match.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs font-semibold hover:underline flex items-center gap-1 font-mono truncate max-w-lg ${
                            isDark ? 'text-cyan-400' : 'text-cyan-800'
                          }`}
                        >
                          <span>{match.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{match.fileType} · {match.dateExposed}</span>
                      </div>
                      <p className={`text-[11px] font-mono p-2 rounded border text-amber-700 break-all ${
                        isDark ? 'bg-slate-900/80 border-slate-800 text-amber-200/90' : 'bg-amber-50/50 border-amber-200 text-amber-900'
                      }`}>
                        {match.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigation Steps */}
            {analysisResult.analysis.mitigationSteps?.length > 0 && (
              <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended Threat Remediation & Defense</span>
                </h4>
                <ul className={`space-y-1 pl-4 list-disc text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {analysisResult.analysis.mitigationSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
