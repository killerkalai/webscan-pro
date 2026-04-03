// Core scan types

// ── Connected Site / Monitoring ──────────────────────────────────────────────

export type MonitorStatus = 'active' | 'paused' | 'error' | 'pending'
export type AlertFrequency = 'realtime' | 'daily' | 'weekly'

export interface ConnectedSite {
  id: string
  siteKey: string           // Unique key embedded in the script tag
  url: string
  ownerEmail: string
  ownerName?: string
  status: MonitorStatus
  alertFrequency: AlertFrequency
  lastScanAt?: string
  lastScore?: number
  lastAlertSentAt?: string
  consecutiveFailures: number
  createdAt: string
  scriptVerified: boolean   // true once the script is detected on the site
}

export interface MonitorAlert {
  id: string
  siteId: string
  siteUrl: string
  triggeredAt: string
  previousScore?: number
  currentScore: number
  newFindings: ScanFinding[]
  emailSent: boolean
}


export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'pass'

export interface ScanFinding {
  id: string
  category: ScanCategory
  severity: Severity
  title: string
  description: string
  details?: string
  recommendation: string
  cve?: string
  owasp?: string
  url?: string
  passed: boolean
}

export type ScanCategory =
  | 'security'
  | 'ssl'
  | 'links'
  | 'performance'
  | 'cve'
  | 'owasp'
  | 'headers'

export interface SslInfo {
  valid: boolean
  issuer?: string
  subject?: string
  validFrom?: string
  validTo?: string
  daysRemaining?: number
  protocol?: string
  grade?: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface PerformanceInfo {
  responseTimeMs: number
  contentSizeKb: number
  compressionEnabled: boolean
  httpVersion: string
  serverHeader?: string
}

export interface LinkCheckResult {
  url: string
  status: number
  ok: boolean
  redirect?: string
}

export interface OwnerContact {
  email?: string
  source: 'provided' | 'whois' | 'contact-page' | 'unknown'
}

export interface ScanResult {
  id: string
  url: string
  scannedAt: string
  durationMs: number
  score: number // 0-100
  findings: ScanFinding[]
  ssl: SslInfo | null
  performance: PerformanceInfo | null
  brokenLinks: LinkCheckResult[]
  ownerContact: OwnerContact
  emailSent: boolean
  emailSentTo?: string
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
    passed: number
  }
}

export interface ScanRequest {
  url: string
  ownerEmail?: string
  sendEmail?: boolean
}

export interface ScanProgress {
  step: string
  stepIndex: number
  totalSteps: number
  percentage: number
}

export type ScanStep =
  | 'Resolving DNS'
  | 'Checking SSL Certificate'
  | 'Fetching Headers'
  | 'Analyzing Security Headers'
  | 'Scanning for XSS Vectors'
  | 'Testing for SQL Injection'
  | 'Checking CSRF Protection'
  | 'Crawling Links'
  | 'Checking for Broken Links'
  | 'Measuring Performance'
  | 'Checking CVE Database'
  | 'Running OWASP Top 10 Checks'
  | 'Looking up WHOIS Data'
  | 'Detecting Owner Email'
  | 'Generating Report'
  | 'Sending Notification'
  | 'Complete'
