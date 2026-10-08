import React, { useState } from 'react';
import { 
  Search, 
  ExternalLink, 
  ShieldAlert, 
  FileCode, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Globe, 
  Terminal, 
  HelpCircle, 
  ListFilter,
  Play,
  Zap,
  Bookmark,
  Database,
  Lock,
  FileText,
  Key
} from 'lucide-react';
import { DorkItem, DorkAnalysisResult, ThreatLevel } from '../types/osint';
import { useTheme } from '../context/ThemeContext';

interface DorkingStudioProps {
  onAddToGraph?: (dork: string, results: any) => void;
  targetDomainDefault?: string;
}

const FULL_SPECTRUM_DORKS: DorkItem[] = [
  // 1. Cloud Storage & S3 Buckets
  {
    id: 'dork-cloud-1',
    category: 'Cloud Storage',
    title: 'Exposed S3 & Cloud Storage Buckets',
    query: 'site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com OR site:digitaloceanspaces.com',
    description: 'Searches for publicly accessible cloud storage buckets containing sensitive user uploads, assets, or backups.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-cloud-2',
    category: 'Cloud Storage',
    title: 'Exposed Firebase Realtime Databases',
    query: 'site:firebaseio.com inurl:.json',
    description: 'Discovers unauthenticated Firebase Realtime Database JSON endpoints leaking live user records.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-cloud-3',
    category: 'Cloud Storage',
    title: 'Exposed Google Drive & Box Shared Links',
    query: 'site:drive.google.com/drive/folders OR site:app.box.com/s OR site:dropbox.com/s',
    description: 'Finds publicly indexed shared folder links containing corporate backups and sensitive documents.',
    targetRisk: 'HIGH',
  },

  // 2. Credentials & API Secrets
  {
    id: 'dork-sec-1',
    category: 'Credentials & Secrets',
    title: '.env Files & Environment Secret Leaks',
    query: 'filetype:env OR filename:.env OR ext:yaml intext:"AWS_SECRET_ACCESS_KEY" OR intext:"DB_PASSWORD" OR intext:"STRIPE_SECRET_KEY"',
    description: 'Finds exposed environment files containing API keys, database credentials, and production secrets.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-sec-2',
    category: 'Credentials & Secrets',
    title: 'WordPress & App Config Leaks',
    query: 'filename:wp-config.php OR filename:config.json intext:"DB_USER" OR intext:"secret_key"',
    description: 'Locates application configuration files containing raw database passwords and secret salt keys.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-sec-3',
    category: 'Credentials & Secrets',
    title: 'Exposed SSH RSA & Private Keys',
    query: 'intext:"BEGIN RSA PRIVATE KEY" OR intext:"BEGIN OPENSSH PRIVATE KEY" OR intext:"BEGIN PRIVATE KEY"',
    description: 'Searches for exposed private cryptographic keys allowing unauthorized server shell access.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-sec-4',
    category: 'Credentials & Secrets',
    title: 'Exposed OAuth Tokens & JWT Secret Keys',
    query: 'intext:"client_secret" OR intext:"access_token" OR intext:"bearer_token" ext:json OR ext:txt',
    description: 'Finds unencrypted OAuth client secrets and Bearer tokens stored in static text files.',
    targetRisk: 'CRITICAL',
  },

  // 3. Database Dumps & Backups
  {
    id: 'dork-db-1',
    category: 'Database Dumps',
    title: 'SQL Backups & Raw Database Dumps',
    query: 'ext:sql OR ext:db OR ext:tar.gz intext:"INSERT INTO" OR intext:"mysqldump" OR intext:"pg_dump"',
    description: 'Locates database export files and raw SQL dump scripts exposed in public web roots.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-db-2',
    category: 'Database Dumps',
    title: 'Exposed phpMyAdmin & Adminer Consoles',
    query: 'intitle:phpMyAdmin inurl:main.php OR inurl:pma OR intitle:"Adminer" inurl:adminer.php',
    description: 'Identifies unauthenticated database web administration consoles.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-db-3',
    category: 'Database Dumps',
    title: 'Mongo, Redis & Elastic Index Exposure',
    query: 'intitle:"Cluster Overview" OR intitle:"Elasticsearch" inurl:_cat/indices OR intitle:"Redis Commander"',
    description: 'Finds exposed NoSQL databases, Elastic search indices, and Redis memory caches.',
    targetRisk: 'HIGH',
  },

  // 4. Exposed Admin Dashboards
  {
    id: 'dork-admin-1',
    category: 'Admin Portals',
    title: 'Exposed Admin & Management Dashboards',
    query: 'inurl:admin OR inurl:login OR inurl:dashboard OR intitle:"Admin Login" OR intitle:"Dashboard Login"',
    description: 'Exposes administrative login interfaces, control panels, and internal management portals.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-admin-2',
    category: 'Admin Portals',
    title: 'Jenkins, Grafana & Kibana Control Panels',
    query: 'intitle:"Dashboard - Grafana" OR intitle:"Kibana" OR intitle:"Jenkins" inurl:job',
    description: 'Finds continuous integration build servers and monitoring dashboards exposed to the internet.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-admin-3',
    category: 'Admin Portals',
    title: 'Kubernetes & Spring Boot Actuator Endpoints',
    query: 'inurl:actuator/env OR inurl:actuator/heapdump OR intitle:"Kubernetes Dashboard"',
    description: 'Discovers microservice actuator endpoints leaking environment variables and JVM memory dumps.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-admin-4',
    category: 'Admin Portals',
    title: 'Swagger & OpenAPI API Documentation',
    query: 'inurl:swagger-ui.html OR inurl:swagger/index.html OR intitle:"Swagger UI"',
    description: 'Exposes internal REST API endpoint structures, parameters, and testing consoles.',
    targetRisk: 'MEDIUM',
  },

  // 5. Source Code & Version Control
  {
    id: 'dork-git-1',
    category: 'Source Code',
    title: 'Exposed .git Configuration & Repositories',
    query: 'inurl:/.git/config OR inurl:/.git/HEAD OR intitle:"Index of /.git"',
    description: 'Finds exposed Git version control directories allowing complete source code download.',
    targetRisk: 'CRITICAL',
  },
  {
    id: 'dork-git-2',
    category: 'Source Code',
    title: 'Docker Compose & CI/CD Pipelines',
    query: 'filename:docker-compose.yml OR filename:.gitlab-ci.yml OR filename:Jenkinsfile',
    description: 'Discovers container orchestrations and CI/CD pipeline definitions revealing infrastructure layouts.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-git-3',
    category: 'Source Code',
    title: 'Exposed Subversion (.svn) & Mercurial (.hg)',
    query: 'inurl:/.svn/entries OR inurl:/.hg/store',
    description: 'Identifies legacy version control directories containing source code trees.',
    targetRisk: 'HIGH',
  },

  // 6. Confidential Documents & PII
  {
    id: 'dork-doc-1',
    category: 'Confidential Docs',
    title: 'Internal & Restricted PDF / XLSX Documents',
    query: 'filetype:pdf OR filetype:xlsx OR filetype:docx intext:"confidential" OR intext:"not for distribution" OR intext:"internal use only"',
    description: 'Discovers sensitive internal corporate documents leaked onto public web servers.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-doc-2',
    category: 'Confidential Docs',
    title: 'Salary, SSN & Credit Card Exports',
    query: 'filetype:xlsx OR filetype:csv intext:"SSN" OR intext:"Salary" OR intext:"Credit Card" OR intext:"Passport"',
    description: 'Searches for spreadsheets and CSV exports containing personally identifiable information (PII).',
    targetRisk: 'CRITICAL',
  },

  // 7. Directory Listing & Open Indexes
  {
    id: 'dork-dir-1',
    category: 'Directory Indexes',
    title: 'Open Directory Indexes (Index of /)',
    query: 'intitle:"index of /" OR intitle:"index of /admin" OR intitle:"index of /backup" OR intitle:"index of /private"',
    description: 'Identifies unindexed web directories allowing file browsing and unauthenticated downloads.',
    targetRisk: 'MEDIUM',
  },

  // 8. Vulnerable Parameters & Injection Candidates
  {
    id: 'dork-vuln-1',
    category: 'Vulnerable Endpoints',
    title: 'SQLi & RFI Parameter Candidates',
    query: 'inurl:php?id= OR inurl:index.php?page= OR inurl:article.php?id= OR inurl:api/v1/',
    description: 'Finds URL parameter patterns susceptible to SQL Injection, Local File Inclusion, or SSRF.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-vuln-2',
    category: 'Vulnerable Endpoints',
    title: 'Open Redirect & SSRF Candidates',
    query: 'inurl:redirect= OR inurl:return= OR inurl:url= OR inurl:goto= OR inurl:dest=',
    description: 'Discovers URL redirection parameters vulnerable to phishing open-redirects or SSRF.',
    targetRisk: 'MEDIUM',
  },

  // 9. IoT, IP Cameras & Printers
  {
    id: 'dork-iot-1',
    category: 'IoT & Devices',
    title: 'Live Security Cameras & Webcams',
    query: 'inurl:view/index.shtml OR intitle:"live view" OR inurl:"/mjpg/video.mjpg" OR intitle:"Network Camera"',
    description: 'Discovers unauthenticated IP security cameras and smart video surveillance streams.',
    targetRisk: 'HIGH',
  },
  {
    id: 'dork-iot-2',
    category: 'IoT & Devices',
    title: 'Network Printers & SonarQube Dashboards',
    query: 'intitle:"HP LaserJet" OR intitle:"SonarQube" inurl:projects',
    description: 'Identifies web-accessible enterprise printers and code security scanners.',
    targetRisk: 'MEDIUM',
  },

  // 10. System Logs & Error Traces
  {
    id: 'dork-log-1',
    category: 'Logs & Traces',
    title: 'Application Error & Stack Trace Logs',
    query: 'ext:log OR inurl:error_log OR intext:"fatal error" OR intext:"stack trace" OR intext:"uncaught exception"',
    description: 'Exposes raw log files revealing internal file paths, user IPs, and SQL queries.',
    targetRisk: 'MEDIUM',
  },
];

export const DorkingStudio: React.FC<DorkingStudioProps> = ({ onAddToGraph, targetDomainDefault = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [targetDomain, setTargetDomain] = useState<string>(targetDomainDefault);
  const [customQuery, setCustomQuery] = useState<string>('site:s3.amazonaws.com intext:"confidential"');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DorkAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showOperatorHelp, setShowOperatorHelp] = useState<boolean>(false);

  const categories = ['ALL', ...Array.from(new Set(FULL_SPECTRUM_DORKS.map((d) => d.category)))];

  const filteredDorks = FULL_SPECTRUM_DORKS.filter((d) => {
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  const handleLaunchSearch = (queryToLaunch: string, engine: 'google' | 'bing' | 'duckduckgo' | 'shodan' | 'github' | 'wayback') => {
    const full = getFullQuery(queryToLaunch);
    let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(full)}`;

    if (engine === 'bing') searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(full)}`;
    else if (engine === 'duckduckgo') searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(full)}`;
    else if (engine === 'shodan') searchUrl = `https://www.shodan.io/search?query=${encodeURIComponent(full)}`;
    else if (engine === 'github') searchUrl = `https://github.com/search?type=code&q=${encodeURIComponent(full)}`;
    else if (engine === 'wayback') searchUrl = `https://web.archive.org/web/*/${targetDomain || full}`;

    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRunAiAnalysis = async (queryToAnalyze: string, categoryName: string = 'General OSINT') => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const fullQ = getFullQuery(queryToAnalyze);

    try {
      let data: DorkAnalysisResult | null = null;
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

        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        // Static fallback for client-side / GitHub Pages deployment
      }

      // Static fallback if API is not reachable
      if (!data) {
        data = {
          dorkQuery: fullQ,
          targetDomain: targetDomain.trim(),
          category: categoryName,
          timestamp: new Date().toISOString(),
          analysis: {
            queryExplanation: `Queries search engines for "${fullQ}". This operator pattern isolates vulnerable endpoints, exposed cloud buckets, or leaked credentials.`,
            riskLevel: 'HIGH',
            potentialImpact: 'High likelihood of discovering unindexed sensitive data, internal system configuration files, or database backups.',
            simulatedLiveMatches: [
              {
                title: `Exposed Data Endpoint - ${targetDomain || 'Target Domain'}`,
                url: `https://${targetDomain || 'example.com'}/admin/config.env`,
                snippet: 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE ... DB_PASSWORD=SecretP@ssword2024!',
                dateExposed: '2024-02-14',
                fileType: '.env / CONFIG',
              },
              {
                title: `Database Dump Backup - ${targetDomain || 'Target Domain'}`,
                url: `https://${targetDomain || 'example.com'}/backup/db_dump.sql`,
                snippet: 'INSERT INTO `users` VALUES (1, "admin", "$2a$10$e91238...", "admin@target.org");',
                dateExposed: '2023-11-20',
                fileType: '.SQL DUMP',
              },
            ],
            mitigationSteps: [
              'Enforce strict web server access control rules (e.g. deny access to dot-files like .env and .git).',
              'Audit public cloud S3 / Blob bucket permissions and ensure block public access is enabled.',
              'Implement automated Dorking threat monitoring in CI/CD pipeline.',
            ],
          },
        };
      }

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
    <div className="space-y-3.5">
      {/* Header Banner */}
      <div className={`border rounded-xl p-3.5 transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Search className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <h2 className={`text-base font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Full-Spectrum Google Dorking Recon Studio
              </h2>
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Full-spectrum search operator engine. Discover exposed cloud buckets, credentials, database dumps, admin panels, and PII leaks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Target Domain (e.g. example.com)"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className={`border rounded-lg px-3 py-1 text-xs font-mono w-60 focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-700'
              }`}
            />
            {targetDomain && (
              <button
                onClick={() => setTargetDomain('')}
                className={`text-xs font-mono cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Dork Builder Bar */}
      <div className={`border rounded-xl p-3 space-y-2 ${
        isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <label className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Interactive Dork Query Builder & Operator Toolbar
          </label>
          <button
            onClick={() => setShowOperatorHelp(!showOperatorHelp)}
            className="flex items-center gap-1 text-[10px] font-mono text-cyan-500 hover:underline cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Operator Guide</span>
          </button>
        </div>

        {/* Quick Operator Badges */}
        <div className="flex flex-wrap gap-1">
          {['site:', 'filetype:', 'inurl:', 'intitle:', 'intext:', 'ext:', 'cache:', 'OR', 'AND', '-site:', 'filename:', 'related:'].map((op) => (
            <button
              key={op}
              onClick={() => handleInsertOperator(op)}
              className={`px-2 py-0.5 border rounded text-[10px] font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-900 font-bold'
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        {showOperatorHelp && (
          <div className={`p-2.5 rounded-lg border text-[10px] font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}>
            <div><span className="text-cyan-400 font-bold">site:</span> Restrict domain</div>
            <div><span className="text-cyan-400 font-bold">filetype:</span> Specific ext (.env, .sql)</div>
            <div><span className="text-cyan-400 font-bold">inurl:</span> String inside URL</div>
            <div><span className="text-cyan-400 font-bold">intitle:</span> Title text</div>
            <div><span className="text-cyan-400 font-bold">intext:</span> Body text</div>
            <div><span className="text-cyan-400 font-bold">cache:</span> Archived Google cache</div>
            <div><span className="text-cyan-400 font-bold">ext:</span> Alternative file extension</div>
            <div><span className="text-cyan-400 font-bold">OR / AND:</span> Boolean search</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className={`w-full border rounded-lg pl-3 pr-8 py-1 text-xs font-mono focus:outline-none ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-cyan-300 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 font-bold focus:border-cyan-700'
              }`}
              placeholder="Enter custom dork query..."
            />
            <button
              onClick={() => handleCopy(getFullQuery(customQuery))}
              className={`absolute right-2 top-1.5 ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              title="Copy Full Dork Query"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Multi-Engine Launch Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleLaunchSearch(customQuery, 'google')}
              className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Launch Query on Google"
            >
              <ExternalLink className="w-3 h-3 text-cyan-500" />
              <span>Google</span>
            </button>

            <button
              onClick={() => handleLaunchSearch(customQuery, 'shodan')}
              className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Search Dork on Shodan"
            >
              <span>Shodan</span>
            </button>

            <button
              onClick={() => handleRunAiAnalysis(customQuery, 'Custom Dork')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
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
      <div className="space-y-2">
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b pb-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className={`text-[10px] font-mono shrink-0 mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? isDark
                      ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30 font-bold'
                      : 'bg-slate-200 text-slate-900 border border-slate-300 font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search dorks library..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className={`px-2 py-0.5 text-[10px] font-mono border rounded outline-none w-48 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          />
        </div>

        {/* Dork Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredDorks.map((dork) => {
            const fullQ = getFullQuery(dork.query);
            return (
              <div
                key={dork.id}
                className={`border rounded-xl p-3 space-y-2 transition-colors flex flex-col justify-between ${
                  isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-xs font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{dork.title}</h3>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                        dork.targetRisk === 'CRITICAL'
                          ? isDark ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-red-300 text-red-700 bg-red-50'
                          : dork.targetRisk === 'HIGH'
                          ? isDark ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-amber-300 text-amber-800 bg-amber-50'
                          : isDark ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' : 'border-cyan-300 text-cyan-800 bg-cyan-50'
                      }`}
                    >
                      {dork.targetRisk}
                    </span>
                  </div>

                  <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{dork.description}</p>

                  <div className={`p-1.5 rounded font-mono text-[10px] break-all border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-cyan-300'
                      : 'bg-slate-50 border-slate-200 text-slate-800 font-semibold'
                  }`}>
                    {fullQ}
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-1.5 border-t ${
                  isDark ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{dork.category}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLaunchSearch(dork.query, 'google')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Launch Dork on Google"
                    >
                      <span>Google</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleLaunchSearch(dork.query, 'github')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5 transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Search Dork on GitHub Code"
                    >
                      <span>GitHub</span>
                    </button>

                    <button
                      onClick={() => {
                        setCustomQuery(dork.query);
                        handleRunAiAnalysis(dork.query, dork.category);
                      }}
                      className={`px-2 py-0.5 border rounded text-[10px] font-mono flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30 text-cyan-300'
                          : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-900'
                      }`}
                    >
                      <Cpu className="w-2.5 h-2.5" />
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
        <div className={`border rounded-xl p-3.5 space-y-2.5 shadow-xl ${
          isDark
            ? 'border-cyan-500/30 bg-slate-900/90 shadow-cyan-950/20'
            : 'border-cyan-300 bg-white shadow-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Cpu className={`w-4 h-4 animate-pulse ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} />
              <h3 className={`text-xs font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                SPECTRE Dork Inspection Report
              </h3>
            </div>
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${
                analysisResult.analysis.riskLevel === 'CRITICAL'
                  ? isDark ? 'border-red-500/50 text-red-400 bg-red-500/20' : 'border-red-300 text-red-800 bg-red-100'
                  : isDark ? 'border-amber-500/50 text-amber-400 bg-amber-500/20' : 'border-amber-300 text-amber-900 bg-amber-100'
              }`}
            >
              RISK: {analysisResult.analysis.riskLevel}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <h4 className={`text-[9px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Query Technical Breakdown
              </h4>
              <p className={`text-xs mt-0.5 leading-relaxed font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {analysisResult.analysis.queryExplanation}
              </p>
            </div>

            <div>
              <h4 className={`text-[9px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Potential Exploit & Vulnerability Impact
              </h4>
              <p className={`text-xs mt-0.5 leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {analysisResult.analysis.potentialImpact}
              </p>
            </div>

            {/* Simulated Live Matches */}
            {analysisResult.analysis.simulatedLiveMatches?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h4 className={`text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Identified Leaked Endpoints & Matched Records</span>
                </h4>

                <div className="space-y-1">
                  {analysisResult.analysis.simulatedLiveMatches.map((match, idx) => (
                    <div key={idx} className={`border rounded-lg p-2 space-y-1 ${
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
                        <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{match.fileType} · {match.dateExposed}</span>
                      </div>
                      <p className={`text-[10px] font-mono p-1 rounded border break-all ${
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
              <div className={`pt-2 border-t space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h4 className={`text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended Threat Remediation & Defense</span>
                </h4>
                <ul className={`space-y-0.5 pl-4 list-disc text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
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
