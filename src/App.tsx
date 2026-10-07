import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { SubTabSelector } from './components/SubTabSelector';
import { DorkingStudio } from './components/DorkingStudio';
import { ShodanScanner } from './components/ShodanScanner';
import { WhoisLookup } from './components/WhoisLookup';
import { BreachIntel } from './components/BreachIntel';
import { VirusTotalScanner } from './components/VirusTotalScanner';
import { FootprintSearch } from './components/FootprintSearch';
import { IpGeolocation } from './components/IpGeolocation';
import { DomainDnsIntel } from './components/DomainDnsIntel';
import { ExifMetadataExtractor } from './components/ExifMetadataExtractor';
import { SocialRecon } from './components/SocialRecon';
import { EmailPhoneIntel } from './components/EmailPhoneIntel';
import { BatchScanner } from './components/BatchScanner';
import { MaltegoIntegration } from './components/MaltegoIntegration';
import { ThreatFeeds } from './components/ThreatFeeds';
import { WaybackIntel } from './components/WaybackIntel';
import { CryptoIntel } from './components/CryptoIntel';
import { ReconOrchestrator } from './components/ReconOrchestrator';
import { SubdomainDiscovery } from './components/SubdomainDiscovery';
import { EmailPatternHunter } from './components/EmailPatternHunter';
import { CertTransparency } from './components/CertTransparency';
import { HashIdentifier } from './components/HashIdentifier';
import { LinkGraph } from './components/LinkGraph';
import { TrackedItemsTable } from './components/TrackedItemsTable';
import { SessionAuditMatrix } from './components/SessionAuditMatrix';
import { DossierReportModal } from './components/DossierReportModal';
import { ApiKeyConfigModal } from './components/ApiKeyConfigModal';
import { InvestigationCase, LinkNode } from './types/osint';

function MainContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeHub, setActiveHub] = useState<string>('search');
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({
    search: 'dorking',
    domain: 'dnsdomain',
    threats: 'shodan',
    forensics: 'session',
    graph: 'graph',
    tracker: 'all',
  });

  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);

  // Active Case state
  const [activeCase, setActiveCase] = useState<InvestigationCase>(() => {
    const saved = localStorage.getItem('spectre_active_case');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      id: 'case-001',
      caseName: 'Operation ShadowPhish',
      targetName: 'shadow-corp.io',
      targetType: 'Domain / Target Org',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Initial OSINT investigation case',
      nodes: [
        { id: 'target-1', label: 'shadow-corp.io', type: 'TARGET' },
        { id: 'domain-1', label: 'admin.shadow-corp.io', type: 'DOMAIN' },
        { id: 'ip-1', label: '1.1.1.1', type: 'IP' },
        { id: 'email-1', label: 'admin@shadow-corp.io', type: 'EMAIL' },
        { id: 'user-1', label: 'octocat', type: 'USERNAME' },
      ],
      edges: [
        { id: 'e1', source: 'target-1', target: 'domain-1', label: 'SUBDOMAIN' },
        { id: 'e2', source: 'domain-1', target: 'ip-1', label: 'RESOLVES' },
        { id: 'e3', source: 'target-1', target: 'email-1', label: 'ADMIN CONTACT' },
        { id: 'e4', source: 'email-1', target: 'user-1', label: 'AUTHOR' },
      ],
    };
  });

  useEffect(() => {
    localStorage.setItem('spectre_active_case', JSON.stringify(activeCase));
  }, [activeCase]);

  const handleNewCase = () => {
    const name = prompt('Enter new investigation case name:', 'Operation Apex');
    if (!name) return;
    const target = prompt('Enter main target domain or username:', 'example.com') || 'example.com';

    const newC: InvestigationCase = {
      id: `case-${Date.now()}`,
      caseName: name,
      targetName: target,
      targetType: target.includes('.') ? 'Domain' : 'Username',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: '',
      nodes: [{ id: `target-${Date.now()}`, label: target, type: 'TARGET' }],
      edges: [],
    };

    setActiveCase(newC);
  };

  const handleAddNodeToCase = (node: LinkNode) => {
    setActiveCase((prev) => {
      if (prev.nodes.some((n) => n.id === node.id || n.label === node.label)) return prev;
      const updatedNodes = [...prev.nodes, node];
      const targetNode = prev.nodes.find((n) => n.type === 'TARGET') || prev.nodes[0];
      const updatedEdges = [...prev.edges];

      if (targetNode) {
        updatedEdges.push({
          id: `edge-${Date.now()}`,
          source: targetNode.id,
          target: node.id,
          label: 'LINKED',
        });
      }

      return {
        ...prev,
        nodes: updatedNodes,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleRemoveNodeFromCase = (id: string) => {
    setActiveCase((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== id),
      edges: prev.edges.filter((e) => e.source !== id && e.target !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  const setSubTab = (subTab: string) => {
    setActiveSubTabs((prev) => ({ ...prev, [activeHub]: subTab }));
  };

  const currentSubTab = activeSubTabs[activeHub] || 'dorking';

  // Define Sub-Tabs for each Hub
  const subTabsMap: Record<string, Array<{ id: string; label: string }>> = {
    search: [
      { id: 'dorking', label: 'Google Dorks Studio' },
      { id: 'footprint', label: 'Username & Social Recon' },
      { id: 'recon', label: '1-Click Auto Recon & Batch Scanner' },
    ],
    domain: [
      { id: 'dnsdomain', label: 'WHOIS, DNS & Server Inspector' },
      { id: 'ipgeo', label: 'IP Geolocation & BGP Matrix' },
      { id: 'subdomain', label: 'Subdomains & Wayback Snapshots' },
    ],
    threats: [
      { id: 'shodan', label: 'Shodan Host & CVE Scanner' },
      { id: 'virustotal', label: 'VirusTotal Malware Intelligence' },
      { id: 'breach', label: 'Dark Web Leaks & Threat Feeds' },
    ],
    forensics: [
      { id: 'session', label: 'Visitor Session Audit & Matrix' },
      { id: 'exif', label: 'Media EXIF & Document Forensics' },
      { id: 'emailphone', label: 'Email, Phone & Hunter' },
      { id: 'crypto', label: 'Crypto Wallet & Hashes' },
    ],
    graph: [
      { id: 'graph', label: 'Interactive Link Canvas' },
      { id: 'maltego', label: 'Maltego Transform Studio' },
    ],
    tracker: [],
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Navbar
        activeHub={activeHub}
        setActiveHub={setActiveHub}
        onNewCase={handleNewCase}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenApiSettings={() => setIsApiModalOpen(true)}
        activeCaseName={activeCase.caseName}
      />

      {/* Compact Main Layout Padding (p-3 sm:p-4 lg:p-5) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5">
        {/* Hub Sub-Tab Navigation Bar */}
        {subTabsMap[activeHub]?.length > 0 && (
          <SubTabSelector
            items={subTabsMap[activeHub] || []}
            activeSubTab={currentSubTab}
            onSelectSubTab={setSubTab}
          />
        )}

        {/* Hub 1: Search & Recon */}
        {activeHub === 'search' && (
          <div className="space-y-4">
            {currentSubTab === 'dorking' && (
              <DorkingStudio
                targetDomainDefault={activeCase.targetName}
                onAddToGraph={(q, a) => handleAddNodeToCase({ id: `dork-${Date.now()}`, label: q.slice(0, 20) + '...', type: 'DORK', details: a.analysis?.queryExplanation || q })}
              />
            )}
            {currentSubTab === 'footprint' && (
              <div className="space-y-4">
                <FootprintSearch onAddToGraph={(u, r) => handleAddNodeToCase({ id: `user-${u}`, label: `@${u}`, type: 'USERNAME', details: `Found on ${r.results?.filter((i: any) => i.exists).length} platforms` })} />
                <SocialRecon />
              </div>
            )}
            {currentSubTab === 'recon' && (
              <div className="space-y-4">
                <ReconOrchestrator />
                <BatchScanner />
              </div>
            )}
          </div>
        )}

        {/* Hub 2: Domain & Network Intel */}
        {activeHub === 'domain' && (
          <div className="space-y-4">
            {currentSubTab === 'dnsdomain' && (
              <div className="space-y-4">
                <DomainDnsIntel
                  defaultDomain={activeCase.targetName}
                  onAddToGraph={(d, dns, h) => handleAddNodeToCase({ id: `dom-${d}`, label: d, type: 'DOMAIN', details: `Grade: ${h?.grade || 'A'} · Server: ${h?.server || 'Unknown'}` })}
                />
                <WhoisLookup
                  defaultDomain={activeCase.targetName}
                  onAddToGraph={(d, w) => handleAddNodeToCase({ id: `whois-${d}`, label: `Registrar: ${w.registrar}`, type: 'DOMAIN', details: `Created: ${w.createdDate}` })}
                />
              </div>
            )}
            {currentSubTab === 'ipgeo' && (
              <IpGeolocation onAddToGraph={(ip, r) => handleAddNodeToCase({ id: `ip-${ip}`, label: ip, type: 'IP', details: `${r.city}, ${r.country} (${r.isp})` })} />
            )}
            {currentSubTab === 'subdomain' && (
              <div className="space-y-4">
                <SubdomainDiscovery
                  defaultDomain={activeCase.targetName}
                  onAddToGraph={(d, r) => handleAddNodeToCase({ id: `sub-${d}`, label: `${d} (${r.totalFound} subdomains)`, type: 'DOMAIN', details: `Subdomain enum` })}
                />
                <WaybackIntel
                  defaultDomain={activeCase.targetName}
                  onAddToGraph={(domain, snapshots) => handleAddNodeToCase({ id: `wayback-${domain}`, label: `${domain} Archive`, type: 'DOMAIN', details: `${snapshots.length} CDX snapshots` })}
                />
              </div>
            )}
          </div>
        )}

        {/* Hub 3: Threat & Vulnerability Matrix */}
        {activeHub === 'threats' && (
          <div className="space-y-4">
            {currentSubTab === 'shodan' && (
              <ShodanScanner
                defaultIp={activeCase.targetName}
                onAddToGraph={(ip, s) => handleAddNodeToCase({ id: `shodan-${ip}`, label: `${ip} (${s.vulnerabilityCount} Vulns)`, type: 'CVE', details: `Ports: ${s.ports?.map((p: any) => p.port).join(', ')}` })}
              />
            )}
            {currentSubTab === 'virustotal' && (
              <VirusTotalScanner
                defaultTarget={activeCase.targetName}
                onAddToGraph={(target, vt) => handleAddNodeToCase({ id: `vt-${target}`, label: `VT Verdict: ${vt.verdict}`, type: 'DOMAIN', details: `${vt.maliciousCount}/${vt.totalVendors} Vendor Flagged` })}
              />
            )}
            {currentSubTab === 'breach' && (
              <div className="space-y-4">
                <BreachIntel
                  onAddToGraph={(target, breaches) => handleAddNodeToCase({ id: `breach-${target}`, label: `${target} (${breaches.length} leaks)`, type: 'BREACH', details: breaches.map(b => b.name).join(', ') })}
                />
                <ThreatFeeds />
              </div>
            )}
          </div>
        )}

        {/* Hub 4: Identity & Media Forensics */}
        {activeHub === 'forensics' && (
          <div className="space-y-4">
            {currentSubTab === 'session' && (
              <SessionAuditMatrix onAddToGraph={handleAddNodeToCase} />
            )}
            {currentSubTab === 'exif' && (
              <ExifMetadataExtractor
                onAddToGraph={(exif) => handleAddNodeToCase({ id: `exif-${Date.now()}`, label: exif.fileName, type: 'LOCATION', details: exif.gpsLatitude ? `GPS: ${exif.gpsLatitude}, ${exif.gpsLongitude}` : exif.fileName })}
              />
            )}
            {currentSubTab === 'emailphone' && (
              <div className="space-y-4">
                <EmailPhoneIntel />
                <EmailPatternHunter
                  defaultDomain={activeCase.targetName}
                  onAddToGraph={(d, r) => handleAddNodeToCase({ id: `hunter-${d}`, label: `Pattern: ${r.pattern}`, type: 'EMAIL', details: `${r.emailsFound?.length || 0} employees found` })}
                />
              </div>
            )}
            {currentSubTab === 'crypto' && (
              <div className="space-y-4">
                <CryptoIntel
                  onAddToGraph={(addr, wallet) => handleAddNodeToCase({ id: `crypto-${addr}`, label: `${wallet.currency} ${addr.slice(0, 8)}...`, type: 'CRYPTO', details: `Balance: ${wallet.balance} ${wallet.currency}` })}
                />
                <CertTransparency />
                <HashIdentifier />
              </div>
            )}
          </div>
        )}

        {/* Hub 5: Link Graph & Maltego Studio */}
        {activeHub === 'graph' && (
          <div className="space-y-4">
            {currentSubTab === 'graph' && (
              <LinkGraph
                nodes={activeCase.nodes}
                edges={activeCase.edges}
                onAddNode={handleAddNodeToCase}
                onRemoveNode={handleRemoveNodeFromCase}
              />
            )}
            {currentSubTab === 'maltego' && (
              <MaltegoIntegration
                activeCase={activeCase}
                onImportNodes={(importedNodes) => {
                  importedNodes.forEach((n) => handleAddNodeToCase(n));
                }}
              />
            )}
          </div>
        )}

        {/* Hub 6: Target Watch Matrix (Tracker Table) */}
        {activeHub === 'tracker' && (
          <TrackedItemsTable
            activeCaseName={activeCase.caseName}
            onAddToGraph={handleAddNodeToCase}
          />
        )}
      </main>

      <DossierReportModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        activeCase={activeCase}
        onUpdateCase={(updated) => setActiveCase(updated)}
      />

      <ApiKeyConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}
