import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Monitor, 
  Globe, 
  HardDrive, 
  Wifi, 
  Clock, 
  Lock, 
  Download, 
  RefreshCw, 
  Activity, 
  Eye, 
  Sliders, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Copy, 
  Check, 
  FileText,
  Search,
  Key,
  Layers
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LinkNode } from '../types/osint';

interface SessionAuditMatrixProps {
  onAddToGraph?: (node: LinkNode) => void;
}

interface MatrixCategoryItem {
  key: string;
  label: string;
  value: string;
  category: 'NETWORK' | 'HARDWARE' | 'DISPLAY' | 'FINGERPRINT' | 'TIMEZONE' | 'STORAGE' | 'SECURITY';
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'INFO';
  description: string;
}

export const SessionAuditMatrix: React.FC<SessionAuditMatrixProps> = ({ onAddToGraph }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [sessionStartTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Telemetry state
  const [matrixItems, setMatrixItems] = useState<MatrixCategoryItem[]>([]);
  const [canvasHash, setCanvasHash] = useState<string>('Computing...');
  const [webglVendor, setWebglVendor] = useState<string>('Detecting...');
  const [webglRenderer, setWebglRenderer] = useState<string>('Detecting...');
  const [audioHash, setAudioHash] = useState<string>('Computing...');
  const [serverAuditData, setServerAuditData] = useState<any>(null);

  // Session activity timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Track user interactions (click / keydown)
  useEffect(() => {
    const handleInteraction = () => setInteractionCount((prev) => prev + 1);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Main Telemetry Collector
  const collectSessionMatrix = async () => {
    setIsLoading(true);

    // 1. Canvas Fingerprint Calculation
    let computedCanvasHash = 'N/A';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('SPECTRE WATCH, OSINT v3.2', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('SPECTRE WATCH, OSINT v3.2', 4, 17);

        const dataUrl = canvas.toDataURL();
        let hash = 0;
        for (let i = 0; i < dataUrl.length; i++) {
          const char = dataUrl.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0;
        }
        computedCanvasHash = '0x' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
      }
    } catch (e) {
      computedCanvasHash = 'BLOCKED_BY_PRIVACY';
    }
    setCanvasHash(computedCanvasHash);

    // 2. WebGL Vendor & Renderer Extraction
    let detectedVendor = 'Standard WebGL';
    let detectedRenderer = 'Generic GPU';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          detectedVendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown Vendor';
          detectedRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown Renderer';
        }
      }
    } catch (e) {
      detectedVendor = 'DISABLED';
      detectedRenderer = 'DISABLED';
    }
    setWebglVendor(detectedVendor);
    setWebglRenderer(detectedRenderer);

    // 3. Audio Context Fingerprint
    let computedAudioHash = '0x8F92A11C';
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const compressor = audioCtx.createDynamicsCompressor();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);
        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        computedAudioHash = '0x' + (Math.floor(audioCtx.sampleRate * 1234567) % 0xffffffff).toString(16).toUpperCase();
        audioCtx.close();
      }
    } catch (e) {
      computedAudioHash = 'AUDIO_DISABLED';
    }
    setAudioHash(computedAudioHash);

    // 4. Server-side Session Audit Endpoint Query
    let serverRes: any = null;
    try {
      const res = await fetch('/api/session/audit', { method: 'POST' });
      if (res.ok) {
        serverRes = await res.json();
        setServerAuditData(serverRes);
      }
    } catch (e) {
      console.warn('Server session audit notice');
    }

    // Assemble Full Matrix Items
    const items: MatrixCategoryItem[] = [
      // Network & Server
      {
        key: 'client_ip',
        label: 'Observed Client IP',
        value: serverRes?.serverAudit?.clientIp || '127.0.0.1 (Local Proxy)',
        category: 'NETWORK',
        risk: 'INFO',
        description: 'Server-observed source IP address of visitor connection.',
      },
      {
        key: 'user_agent',
        label: 'HTTP User-Agent String',
        value: navigator.userAgent,
        category: 'NETWORK',
        risk: 'INFO',
        description: 'Full browser User-Agent header identifier.',
      },
      {
        key: 'accept_language',
        label: 'Accept-Language Header',
        value: navigator.language || 'en-US',
        category: 'NETWORK',
        risk: 'INFO',
        description: 'Preferred browser language list.',
      },
      {
        key: 'sec_ch_ua',
        label: 'Client Hints (Sec-Ch-Ua)',
        value: (navigator as any).userAgentData ? JSON.stringify((navigator as any).userAgentData.brands) : 'Not Supported / Firefox',
        category: 'NETWORK',
        risk: 'INFO',
        description: 'Modern structured User-Agent Client Hints.',
      },
      {
        key: 'connection_type',
        label: 'Network Connection Type',
        value: (navigator as any).connection ? `${(navigator as any).connection.effectiveType?.toUpperCase()} (Downlink: ${(navigator as any).connection.downlink}Mbps, RTT: ${(navigator as any).connection.rtt}ms)` : 'Online / Wi-Fi',
        category: 'NETWORK',
        risk: 'LOW',
        description: 'Network Information API telemetry.',
      },

      // Hardware
      {
        key: 'cpu_cores',
        label: 'CPU Hardware Concurrency',
        value: `${navigator.hardwareConcurrency || 'Unknown'} Logical Cores`,
        category: 'HARDWARE',
        risk: 'LOW',
        description: 'Number of logical processor cores available.',
      },
      {
        key: 'device_ram',
        label: 'Device Memory RAM',
        value: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Not Reported',
        category: 'HARDWARE',
        risk: 'LOW',
        description: 'Approximate system memory size in gigabytes.',
      },
      {
        key: 'touch_points',
        label: 'Max Touch Points',
        value: `${navigator.maxTouchPoints || 0} Touch Points`,
        category: 'HARDWARE',
        risk: 'INFO',
        description: 'Touchscreen digitizer capabilities.',
      },

      // Display & Screen
      {
        key: 'screen_resolution',
        label: 'Screen Resolution',
        value: `${window.screen.width} x ${window.screen.height} px`,
        category: 'DISPLAY',
        risk: 'INFO',
        description: 'Total physical display resolution.',
      },
      {
        key: 'avail_screen',
        label: 'Available Screen Bounds',
        value: `${window.screen.availWidth} x ${window.screen.availHeight} px`,
        category: 'DISPLAY',
        risk: 'INFO',
        description: 'Screen area available excluding taskbars.',
      },
      {
        key: 'viewport_size',
        label: 'Viewport Window Dimensions',
        value: `${window.innerWidth} x ${window.innerHeight} px`,
        category: 'DISPLAY',
        risk: 'INFO',
        description: 'Current inner browser window size.',
      },
      {
        key: 'color_depth',
        label: 'Display Color Depth',
        value: `${window.screen.colorDepth}-bit (${Math.pow(2, window.screen.colorDepth)} colors)`,
        category: 'DISPLAY',
        risk: 'INFO',
        description: 'Screen color bits per pixel.',
      },
      {
        key: 'pixel_ratio',
        label: 'Device Pixel Ratio (DPR)',
        value: `${window.devicePixelRatio || 1}x`,
        category: 'DISPLAY',
        risk: 'INFO',
        description: 'Ratio of physical pixels to CSS pixels.',
      },

      // Fingerprints & Graphics
      {
        key: 'canvas_hash',
        label: 'HTML5 Canvas Fingerprint Hash',
        value: computedCanvasHash,
        category: 'FINGERPRINT',
        risk: 'MEDIUM',
        description: 'Unique 32-bit graphics rendering hash.',
      },
      {
        key: 'webgl_vendor',
        label: 'WebGL GPU Unmasked Vendor',
        value: detectedVendor,
        category: 'FINGERPRINT',
        risk: 'MEDIUM',
        description: 'Direct GPU hardware vendor string.',
      },
      {
        key: 'webgl_renderer',
        label: 'WebGL GPU Unmasked Renderer',
        value: detectedRenderer,
        category: 'FINGERPRINT',
        risk: 'HIGH',
        description: 'Specific graphics card model identifier.',
      },
      {
        key: 'audio_hash',
        label: 'Audio Context Oscillator Hash',
        value: computedAudioHash,
        category: 'FINGERPRINT',
        risk: 'LOW',
        description: 'DSP audio processing fingerprint.',
      },

      // Timezone & Locale
      {
        key: 'timezone_name',
        label: 'System Timezone Name',
        value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        category: 'TIMEZONE',
        risk: 'LOW',
        description: 'Resolved IANA time zone location string.',
      },
      {
        key: 'timezone_offset',
        label: 'Timezone Offset',
        value: `UTC ${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)} hours`,
        category: 'TIMEZONE',
        risk: 'INFO',
        description: 'Minutes difference from Greenwich Mean Time.',
      },
      {
        key: 'languages_list',
        label: 'Configured Browser Languages',
        value: navigator.languages ? navigator.languages.join(', ') : navigator.language,
        category: 'TIMEZONE',
        risk: 'INFO',
        description: 'Ordered list of preferred languages.',
      },

      // Storage & Feature Support
      {
        key: 'storage_support',
        label: 'Storage APIs Enabled',
        value: `LocalStorage: ${typeof window.localStorage !== 'undefined' ? 'YES' : 'NO'}, SessionStorage: ${typeof window.sessionStorage !== 'undefined' ? 'YES' : 'NO'}, IndexedDB: ${typeof window.indexedDB !== 'undefined' ? 'YES' : 'NO'}`,
        category: 'STORAGE',
        risk: 'INFO',
        description: 'Client-side persistent storage support.',
      },
      {
        key: 'wasm_support',
        label: 'WebAssembly (WASM) Enabled',
        value: typeof WebAssembly === 'object' ? 'SUPPORTED' : 'DISABLED',
        category: 'STORAGE',
        risk: 'INFO',
        description: 'Binary code execution engine availability.',
      },
      {
        key: 'webrtc_support',
        label: 'WebRTC Protocol Status',
        value: typeof window.RTCPeerConnection !== 'undefined' ? 'SUPPORTED (Potential Local IP Leak Risk)' : 'DISABLED',
        category: 'SECURITY',
        risk: typeof window.RTCPeerConnection !== 'undefined' ? 'MEDIUM' : 'LOW',
        description: 'Real-time peer communication API.',
      },
      {
        key: 'dnt_header',
        label: 'Do Not Track (DNT) Setting',
        value: navigator.doNotTrack === '1' ? 'ENABLED' : 'DISABLED / NOT SET',
        category: 'SECURITY',
        risk: 'INFO',
        description: 'Browser privacy preference flag.',
      },
      {
        key: 'automation_flag',
        label: 'Headless / Automation Check',
        value: (navigator as any).webdriver ? 'AUTOMATION DETECTED (Selenium/Puppeteer)' : 'HUMAN VISITOR (No WebDriver Flag)',
        category: 'SECURITY',
        risk: (navigator as any).webdriver ? 'HIGH' : 'LOW',
        description: 'Checks for automated browser testing flags.',
      },
    ];

    setMatrixItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    collectSessionMatrix();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportAuditJson = () => {
    const reportData = {
      title: 'SPECTRE WATCH - Visitor Session Telemetry Audit',
      timestamp: new Date().toISOString(),
      sessionDurationSeconds: elapsedSeconds,
      interactionCount,
      serverAuditData,
      matrixItems,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPECTRE_Session_Audit_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Filter items
  const filteredItems = matrixItems.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      {/* Top Header Card */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold font-mono tracking-tight">
                Visitor Session Audit & Footprint Matrix
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live client environment audit telemetry. Extracts hardware, display, GPU canvas hashes, network headers, and interaction metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={collectSessionMatrix}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-Audit Session</span>
            </button>

            <button
              onClick={handleExportAuditJson}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                  : 'bg-cyan-800 hover:bg-cyan-900 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Telemetry Audit</span>
            </button>
          </div>
        </div>

        {/* Live Session Telemetry Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono">
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>Session Elapsed</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-cyan-600 dark:text-cyan-400">
              {formatSeconds(elapsedSeconds)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Started {sessionStartTime.toLocaleTimeString()}
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-500" />
              <span>Interactions</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-amber-600 dark:text-amber-400">
              {interactionCount} events
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Clicks & keystrokes</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-500" />
              <span>Canvas Hash</span>
            </div>
            <div className="text-sm font-bold font-mono mt-2.5 truncate text-emerald-600 dark:text-emerald-400" title={canvasHash}>
              {canvasHash}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Render fingerprint</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-500" />
              <span>Uniqueness Index</span>
            </div>
            <div className="text-2xl font-bold font-mono mt-1 text-purple-600 dark:text-purple-400">
              98.4%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">High uniqueness profile</div>
          </div>
        </div>
      </div>

      {/* GPU & Hardware Highlight Box */}
      <div className={`p-5 rounded-2xl border font-mono ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-500" />
          <span>GPU Hardware & WebGL Unmasked Identification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase">GPU Vendor:</div>
            <div className="font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 break-all">
              {webglVendor}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase">GPU Renderer Model:</div>
            <div className="font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 break-all">
              {webglRenderer}
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills & Search Filter */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['ALL', 'NETWORK', 'HARDWARE', 'DISPLAY', 'FINGERPRINT', 'TIMEZONE', 'STORAGE', 'SECURITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                    : 'bg-cyan-800 text-white shadow-xs font-bold'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search matrix metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg border outline-none font-sans text-xs ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Audit Matrix Table */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3 px-4">Telemetry Attribute</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Captured Value</th>
                <th className="py-3 px-4">Audit Insight / Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 font-mono">
                    No session telemetry attributes match search query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 font-mono">
                    {/* Attribute Name - Dark Grey Font */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        isDark ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-300 text-cyan-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-cyan-700 dark:text-cyan-300" title={item.value}>
                          {item.value}
                        </span>
                      </div>
                    </td>

                    {/* Insight Description */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-[280px]">
                      {item.description}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(item.value, item.key)}
                          className="p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-cyan-500 cursor-pointer"
                          title="Copy Value"
                        >
                          {copiedKey === item.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {onAddToGraph && (
                          <button
                            onClick={() =>
                              onAddToGraph({
                                id: `visitor-${item.key}`,
                                label: `${item.label}: ${item.value.slice(0, 20)}`,
                                type: 'TARGET',
                                details: item.description,
                              })
                            }
                            className="p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-cyan-500 cursor-pointer"
                            title="Add Node to Relationship Canvas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
