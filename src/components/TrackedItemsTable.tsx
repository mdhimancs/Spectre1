import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Download, 
  Tag, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Copy, 
  Check, 
  Globe, 
  Server, 
  User, 
  Mail, 
  Coins, 
  FileCode, 
  Eye, 
  Edit3,
  ListFilter
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { TrackedItem, ThreatLevel, TrackingStatus, LinkNode } from '../types/osint';

interface TrackedItemsTableProps {
  activeCaseName?: string;
  onAddToGraph?: (node: LinkNode) => void;
  onNavigateToTool?: (toolId: string, query: string) => void;
}

const DEFAULT_TRACKED_ITEMS: TrackedItem[] = [
  {
    id: 'tr-001',
    target: 'shadow-corp.io',
    type: 'DOMAIN',
    riskLevel: 'CRITICAL',
    status: 'FLAGGED',
    caseName: 'Operation ShadowPhish',
    category: 'Phishing Infrastructure',
    tags: ['C2', 'Lookalike', 'Fast-Flux'],
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastCheckedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    findingsCount: 14,
    notes: 'Primary apex target. SPF record misconfigured. Resolved to bulletproof host in Romania.',
    details: 'NS: ns1.bulletproofdns.net, Registrar: NameCheap',
  },
  {
    id: 'tr-002',
    target: '185.220.101.5',
    type: 'IP',
    riskLevel: 'HIGH',
    status: 'ACTIVE',
    caseName: 'Operation ShadowPhish',
    category: 'Network Node',
    tags: ['Tor Exit', 'Shodan CVE', 'Port 8080'],
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastCheckedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    findingsCount: 8,
    notes: 'Exposes open HTTP proxy and SSH daemon. Flagged on 4 threat intelligence feeds.',
    details: 'ISP: M247 Europe Ltd, Country: NL',
  },
  {
    id: 'tr-003',
    target: 'octocat_shadow',
    type: 'USERNAME',
    riskLevel: 'MEDIUM',
    status: 'VERIFIED',
    caseName: 'Operation ShadowPhish',
    category: 'Threat Actor Handle',
    tags: ['GitHub', 'Telegram', 'Keybase'],
    addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    lastCheckedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    findingsCount: 6,
    notes: 'Identified matching handle across 12 developer forums. Associated commit history verified.',
    details: 'Last activity: 3 hours ago on forum.hackin.io',
  },
  {
    id: 'tr-004',
    target: 'admin@shadow-corp.io',
    type: 'EMAIL',
    riskLevel: 'HIGH',
    status: 'FLAGGED',
    caseName: 'Operation ShadowPhish',
    category: 'Contact Handle',
    tags: ['Breached', 'Gravatar Exposed'],
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    lastCheckedAt: new Date(Date.now() - 1800000).toISOString(),
    findingsCount: 3,
    notes: 'Found in 2023 collection #1 breach dump. Linked Gravatar profile reveals profile image.',
    details: 'MX verified active. Gravatar hash linked.',
  },
  {
    id: 'tr-005',
    target: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    type: 'CRYPTO',
    riskLevel: 'INFO',
    status: 'ACTIVE',
    caseName: 'Operation ShadowPhish',
    category: 'Ransomware Wallet',
    tags: ['Bitcoin', 'High Volume'],
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    lastCheckedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    findingsCount: 150,
    notes: 'Monitoring ransom payouts. Total volume > 50 BTC.',
    details: 'Currency: BTC, Balance: 68.21 BTC',
  },
];

export const TrackedItemsTable: React.FC<TrackedItemsTableProps> = ({
  activeCaseName = 'Operation ShadowPhish',
  onAddToGraph,
  onNavigateToTool,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [items, setItems] = useState<TrackedItem[]>(() => {
    const saved = localStorage.getItem('spectre_tracked_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        /* fallback */
      }
    }
    return DEFAULT_TRACKED_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for Adding New Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemTarget, setNewItemTarget] = useState('');
  const [newItemType, setNewItemType] = useState<TrackedItem['type']>('DOMAIN');
  const [newItemRisk, setNewItemRisk] = useState<ThreatLevel>('HIGH');
  const [newItemStatus, setNewItemStatus] = useState<TrackingStatus>('ACTIVE');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemTags, setNewItemTags] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Editing notes state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('spectre_tracked_items', JSON.stringify(items));
  }, [items]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTarget.trim()) return;

    const tagsArray = newItemTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const created: TrackedItem = {
      id: `tr-${Date.now()}`,
      target: newItemTarget.trim(),
      type: newItemType,
      riskLevel: newItemRisk,
      status: newItemStatus,
      caseName: activeCaseName,
      category: newItemCategory.trim() || 'General Investigation',
      tags: tagsArray.length > 0 ? tagsArray : ['OSINT Watch'],
      addedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      findingsCount: 1,
      notes: newItemNotes.trim() || 'Added to tracking matrix',
    };

    setItems([created, ...items]);

    // Reset Form
    setNewItemTarget('');
    setNewItemCategory('');
    setNewItemTags('');
    setNewItemNotes('');
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Remove target from tracking matrix?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleRescan = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              lastCheckedAt: new Date().toISOString(),
              findingsCount: item.findingsCount + Math.floor(Math.random() * 3) + 1,
            };
          }
          return item;
        })
      );
      setRefreshingId(null);
    }, 1200);
  };

  const handleSaveNotes = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes: editingNotes } : i))
    );
    setEditingId(null);
  };

  const handleExportCSV = () => {
    const headers = ['Target', 'Type', 'Risk Level', 'Status', 'Case', 'Category', 'Tags', 'Last Checked', 'Notes'];
    const rows = filteredItems.map((i) => [
      `"${i.target}"`,
      i.type,
      i.riskLevel,
      i.status,
      `"${i.caseName || ''}"`,
      `"${i.category || ''}"`,
      `"${i.tags.join('; ')}"`,
      `"${new Date(i.lastCheckedAt).toLocaleString()}"`,
      `"${i.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SPECTRE_Tracked_Targets_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredItems = items.filter((item) => {
    const matchesQuery =
      item.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'ALL' || item.type === filterType;
    const matchesRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    return matchesQuery && matchesType && matchesRisk && matchesStatus;
  });

  // Risk styling helper
  const getRiskBadge = (risk: ThreatLevel) => {
    switch (risk) {
      case 'CRITICAL':
        return isDark
          ? 'bg-red-950/80 text-red-300 border-red-800'
          : 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return isDark
          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
          : 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return isDark
          ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800'
          : 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return isDark
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          : 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return isDark
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case 'FLAGGED':
        return isDark
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-red-50 text-red-700 border-red-200';
      case 'ACTIVE':
        return isDark
          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          : 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'VERIFIED':
        return isDark
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return isDark
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return isDark
          ? 'bg-slate-800 text-slate-400 border-slate-700'
          : 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getTypeIcon = (type: TrackedItem['type']) => {
    switch (type) {
      case 'DOMAIN':
        return <Globe className="w-3.5 h-3.5 text-cyan-500" />;
      case 'IP':
        return <Server className="w-3.5 h-3.5 text-amber-500" />;
      case 'USERNAME':
        return <User className="w-3.5 h-3.5 text-emerald-500" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-purple-500" />;
      case 'CRYPTO':
        return <Coins className="w-3.5 h-3.5 text-yellow-500" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Stats calculation
  const totalCount = items.length;
  const criticalCount = items.filter((i) => i.riskLevel === 'CRITICAL' || i.riskLevel === 'HIGH').length;
  const flaggedCount = items.filter((i) => i.status === 'FLAGGED').length;
  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;

  return (
    <div className="space-y-3.5">
      {/* Top Section Header */}
      <div className={`p-4 rounded-xl border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold font-mono tracking-tight">
                Target Tracking Matrix & Watchlist
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active OSINT target monitoring dashboard. Real-time threat status, notes, and direct canvas integration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-medium rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                  : 'bg-cyan-800 hover:bg-cyan-900 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Target to Watch</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono">
          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Tracked</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across active cases</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-red-950/20 border-red-900/40 text-red-400' : 'bg-red-50/80 border-red-200 text-red-900'
          }`}>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Critical / High Risk</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{criticalCount}</div>
            <div className="text-[11px] opacity-80 mt-0.5">Immediate triage required</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-400' : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Flagged Incidents</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{flaggedCount}</div>
            <div className="text-[11px] opacity-80 mt-0.5">Actionable indicators</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            isDark ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50/80 border-cyan-200 text-cyan-900'
          }`}>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Active Monitoring</div>
            <div className="text-2xl font-bold font-mono mt-0.5">{activeCount}</div>
            <div className="text-[11px] opacity-80 mt-0.5">Live background check</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter targets, tags, categories, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-lg border outline-none font-sans ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-700'
            }`}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 hidden sm:inline">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Types</option>
              <option value="DOMAIN">Domains</option>
              <option value="IP">IP Addresses</option>
              <option value="USERNAME">Usernames</option>
              <option value="EMAIL">Emails</option>
              <option value="CRYPTO">Crypto Wallets</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 hidden sm:inline">Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 hidden sm:inline">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border cursor-pointer outline-none ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="FLAGGED">Flagged</option>
              <option value="ACTIVE">Active</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tracked Inventory Table */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Target Item</th>
                <th className="py-2 px-3">Risk Matrix</th>
                <th className="py-2 px-3">Category & Tags</th>
                <th className="py-2 px-3">Findings</th>
                <th className="py-2 px-3">Last Checked</th>
                <th className="py-2 px-3">Notes / Notes Log</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-mono">
                    No tracked targets found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40`}
                  >
                    {/* Status Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'FLAGGED' ? 'bg-red-500 animate-pulse' :
                          item.status === 'ACTIVE' ? 'bg-cyan-400' : 'bg-emerald-400'
                        }`} />
                        {item.status}
                      </span>
                    </td>

                    {/* Target Item Name & Type - Dark Grey Font */}
                    <td className="py-2 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {getTypeIcon(item.type)}
                        </span>
                        <div>
                          <div className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <span>{item.target}</span>
                            <button
                              onClick={() => handleCopy(item.target, item.id)}
                              className="text-slate-400 hover:text-cyan-500 cursor-pointer"
                              title="Copy Target"
                            >
                              {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-400">
                            Type: <span className="font-semibold uppercase">{item.type}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-2 px-3 whitespace-nowrap font-mono">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getRiskBadge(item.riskLevel)}`}>
                        {item.riskLevel}
                      </span>
                    </td>

                    {/* Category & Tag Chips */}
                    <td className="py-2 px-3 max-w-[200px]">
                      <div className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {item.category || 'Unassigned'}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          >
                            <Tag className="w-2 h-2" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Findings Counter */}
                    <td className="py-2 px-3 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
                          {item.findingsCount} points
                        </span>
                      </div>
                    </td>

                    {/* Last Checked */}
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {new Date(item.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <div className="text-[9px] opacity-70">
                        {new Date(item.lastCheckedAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Notes & Quick Edit - Dark Grey Font */}
                    <td className="py-2 px-3 max-w-[220px]">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            className="w-full px-1.5 py-0.5 rounded text-[11px] border bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-cyan-500 outline-none"
                          />
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            className="p-1 rounded bg-emerald-600 text-white cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="group relative flex items-start justify-between gap-1">
                          <p className="text-[10px] text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                            {item.notes}
                          </p>
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingNotes(item.notes);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-cyan-500 cursor-pointer shrink-0"
                            title="Edit Notes"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="py-2 px-3 text-right whitespace-nowrap font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Rescan Button */}
                        <button
                          onClick={() => handleRescan(item.id)}
                          className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                            refreshingId === item.id
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-spin'
                              : isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                          title="Trigger OSINT Refresh"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Add to Link Graph */}
                        {onAddToGraph && (
                          <button
                            onClick={() =>
                              onAddToGraph({
                                id: `node-${item.id}`,
                                label: item.target,
                                type: item.type === 'DOMAIN' ? 'DOMAIN' : item.type === 'IP' ? 'IP' : item.type === 'USERNAME' ? 'USERNAME' : 'TARGET',
                                details: item.notes,
                                risk: item.riskLevel,
                              })
                            }
                            className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 hover:border-cyan-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 text-slate-700 border-slate-300'
                            }`}
                            title="Add Node to Relationship Canvas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className={`p-1.5 rounded-md border transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-red-950 hover:text-red-400 hover:border-red-800 text-slate-400 border-slate-700'
                              : 'bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-slate-500 border-slate-300'
                          }`}
                          title="Remove from tracking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Target Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`max-w-lg w-full rounded-2xl border p-6 shadow-2xl font-sans ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" />
                <h3 className="text-lg font-bold font-mono">Add New Target to Tracking Matrix</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xl font-mono cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4 mt-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Name / Domain / IP / Username:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. shadow-domain.com or 104.21.55.12"
                  value={newItemTarget}
                  onChange={(e) => setNewItemTarget(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none font-sans ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Type:</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as TrackedItem['type'])}
                    className={`w-full px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="DOMAIN">Domain Name</option>
                    <option value="IP">IP Address</option>
                    <option value="USERNAME">Username Handle</option>
                    <option value="EMAIL">Email Address</option>
                    <option value="CRYPTO">Crypto Wallet</option>
                    <option value="HASH">Password Hash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Initial Risk Level:</label>
                  <select
                    value={newItemRisk}
                    onChange={(e) => setNewItemRisk(e.target.value as ThreatLevel)}
                    className={`w-full px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Status:</label>
                  <select
                    value={newItemStatus}
                    onChange={(e) => setNewItemStatus(e.target.value as TrackingStatus)}
                    className={`w-full px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ACTIVE">Active Monitoring</option>
                    <option value="FLAGGED">Flagged Incident</option>
                    <option value="VERIFIED">Verified Clean</option>
                    <option value="PENDING">Pending Triage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Category:</label>
                  <input
                    type="text"
                    placeholder="e.g. Phishing / C2 Server"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border outline-none font-sans ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tags (comma separated):</label>
                <input
                  type="text"
                  placeholder="e.g. C2, Bulletproof, Malware"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none font-sans ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investigation Notes & Context:</label>
                <textarea
                  rows={3}
                  placeholder="Enter preliminary notes, registrar findings, or threat intelligence summary..."
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border outline-none font-sans ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg border cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer shadow-sm"
                >
                  Add Target to Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
