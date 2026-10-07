export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type TrackingStatus = 'ACTIVE' | 'FLAGGED' | 'VERIFIED' | 'PENDING' | 'ARCHIVED';

export interface TrackedItem {
  id: string;
  target: string;
  type: 'DOMAIN' | 'IP' | 'USERNAME' | 'EMAIL' | 'CRYPTO' | 'HASH' | 'PHONE' | 'DORK' | 'OTHER';
  riskLevel: ThreatLevel;
  status: TrackingStatus;
  caseId?: string;
  caseName?: string;
  category?: string;
  tags: string[];
  addedAt: string;
  lastCheckedAt: string;
  findingsCount: number;
  notes: string;
  details?: string;
}

export interface DorkItem {
  id: string;
  category: string;
  title: string;
  query: string;
  description: string;
  targetRisk: ThreatLevel;
}

export interface DorkMatchResult {
  title: string;
  url: string;
  snippet: string;
  dateExposed: string;
  fileType: string;
}

export interface DorkAnalysisResult {
  dorkQuery: string;
  targetDomain?: string;
  category?: string;
  analysis: {
    queryExplanation: string;
    riskLevel: ThreatLevel;
    simulatedLiveMatches: DorkMatchResult[];
    potentialImpact: string;
    mitigationSteps: string[];
  };
  timestamp: string;
}

export interface UsernameCheckResult {
  name: string;
  category: string;
  url: string;
  exists: boolean;
  statusCode: number;
}

export interface FootprintResponse {
  username: string;
  totalChecked: number;
  results: UsernameCheckResult[];
}

export interface IpGeoResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  asn: string;
  isProxy: boolean;
}

export interface DnsRecordResult {
  domain: string;
  records: {
    A?: string[];
    AAAA?: string[];
    MX?: Array<{ exchange: string; priority: number }>;
    TXT?: string[][];
    NS?: string[];
    SOA?: { nsname: string; hostmaster: string; serial: number; refresh: number; retry: number; expire: number; minttl: number } | null;
    CNAME?: string[];
  };
  timestamp: string;
}

export interface SecurityHeaderItem {
  header: string;
  name: string;
  present: boolean;
  value: string;
  risk: ThreatLevel;
  recommendation: string;
}

export interface HeaderAnalysisResult {
  url: string;
  finalUrl: string;
  status: number;
  statusText: string;
  responseTimeMs: number;
  server: string;
  poweredBy: string;
  contentType: string;
  securityChecklist: SecurityHeaderItem[];
  grade: string;
  allHeaders: Record<string, string>;
}

export interface ExifParsedData {
  fileName: string;
  fileSize: number;
  fileType: string;
  make?: string;
  model?: string;
  lensModel?: string;
  dateTimeOriginal?: string;
  exposureTime?: string;
  fNumber?: string;
  isoSpeed?: string;
  focalLength?: string;
  software?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  rawTags: Record<string, string>;
  privacyRisks: string[];
}

export interface ShodanPortInfo {
  port: number;
  service: string;
  banner: string;
  transport: 'tcp' | 'udp';
  cves?: string[];
}

export interface ShodanScanResult {
  ip: string;
  hostnames: string[];
  os?: string;
  ports: ShodanPortInfo[];
  cveList: Array<{ id: string; cvss: number; summary: string }>;
  vulnerabilityCount: number;
  lastScanDate: string;
}

export interface WhoisRecordResult {
  domain: string;
  registrar: string;
  createdDate: string;
  updatedDate: string;
  expiresDate: string;
  nameServers: string[];
  registrantCountry: string;
  privacyShield: boolean;
  coHostedDomains?: string[];
}

export interface BreachRecord {
  name: string;
  domain: string;
  breachDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
}

export interface VirusTotalResult {
  target: string;
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount: number;
  totalVendors: number;
  verdict: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  reputationScore: number;
  sslCertSha256?: string;
  vendorDetections: Array<{ vendor: string; result: string; category: string }>;
}

export interface WaybackSnapshot {
  url: string;
  timestamp: string;
  originalUrl: string;
  mimeType: string;
  status: string;
  archiveUrl: string;
}

export interface CryptoWalletResult {
  address: string;
  currency: 'BTC' | 'ETH' | 'USDT' | 'XMR';
  balance: number;
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
  sanctionsFlag: boolean;
  firstSeen: string;
  lastSeen: string;
  recentTx: Array<{ txHash: string; amount: number; type: 'IN' | 'OUT'; timestamp: string }>;
}

export interface SubdomainEnumResult {
  domain: string;
  subdomains: Array<{ subdomain: string; ip: string; status: number; server: string }>;
  totalFound: number;
}

export interface EmailPatternResult {
  domain: string;
  pattern: string;
  confidence: number;
  emailsFound: Array<{ name: string; position: string; email: string; verificationStatus: string }>;
}

export interface CertTransparencyResult {
  domain: string;
  certificates: Array<{ id: string; issuer: string; loggedDate: string; notAfter: string; commonName: string; matchingDomains: string[] }>;
}

export interface HashIdentifyResult {
  hash: string;
  possibleAlgorithms: string[];
  recommendedCrackers: string[];
  leakDatabaseStatus: string;
  plaintextCandidate?: string;
}

export interface BatchItemResult {
  target: string;
  type: 'IP' | 'DOMAIN' | 'EMAIL';
  status: 'COMPLETED' | 'FAILED';
  summary: string;
  riskScore: number;
}

export interface LinkNode {
  id: string;
  label: string;
  type: 'TARGET' | 'DOMAIN' | 'IP' | 'EMAIL' | 'USERNAME' | 'PHONE' | 'DORK' | 'LOCATION' | 'CVE' | 'BREACH' | 'CRYPTO';
  details?: string;
  risk?: ThreatLevel;
  x?: number;
  y?: number;
}

export interface LinkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface InvestigationCase {
  id: string;
  caseName: string;
  targetName: string;
  targetType: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  nodes: LinkNode[];
  edges: LinkEdge[];
  dorkResults?: DorkAnalysisResult[];
  ipResults?: IpGeoResult[];
  dnsResults?: DnsRecordResult[];
  usernameResults?: FootprintResponse[];
  exifResults?: ExifParsedData[];
  shodanResults?: ShodanScanResult[];
  whoisResults?: WhoisRecordResult[];
  breachResults?: BreachRecord[];
  vtResults?: VirusTotalResult[];
  waybackResults?: WaybackSnapshot[];
  cryptoResults?: CryptoWalletResult[];
  subdomainResults?: SubdomainEnumResult[];
  emailPatternResults?: EmailPatternResult[];
  certResults?: CertTransparencyResult[];
  hashResults?: HashIdentifyResult[];
  aiDossier?: any;
}
