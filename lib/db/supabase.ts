import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// ── One-off Scans ─────────────────────────────────────────────────────────────

export async function saveScanResult(result: any) {
  try {
    const { error } = await supabase.from('scan_results').insert({
      id: result.id,
      url: result.url,
      score: result.score,
      scanned_at: result.scannedAt,
      duration_ms: result.durationMs,
      email_sent: result.emailSent,
      email_sent_to: result.emailSentTo,
      owner_contact_source: result.ownerContact?.source,
      summary: result.summary,
      ssl_info: result.ssl,
      performance_info: result.performance,
      broken_links: result.brokenLinks,
      findings: result.findings,
    })
    if (error) console.error('Supabase save error:', error)
  } catch (err) {
    console.error('Failed to save scan result:', err)
  }
}

export async function getRecentScans(limit = 10) {
  const { data, error } = await supabase
    .from('scan_results')
    .select('id, url, score, scanned_at, email_sent, summary')
    .order('scanned_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('Supabase fetch error:', error); return [] }
  return data
}

// ── Connected Sites ───────────────────────────────────────────────────────────

export async function registerSite(data: {
  siteKey: string
  url: string
  ownerEmail: string
  ownerName?: string
  alertFrequency?: string
}) {
  const { data: row, error } = await supabase
    .from('connected_sites')
    .insert({
      site_key: data.siteKey,
      url: data.url,
      owner_email: data.ownerEmail,
      owner_name: data.ownerName,
      alert_frequency: data.alertFrequency || 'realtime',
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return row
}

export async function getSiteByKey(siteKey: string) {
  const { data } = await supabase
    .from('connected_sites')
    .select('*')
    .eq('site_key', siteKey)
    .single()
  return data
}

export async function updateSiteStatus(siteKey: string, updates: Record<string, any>) {
  await supabase
    .from('connected_sites')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('site_key', siteKey)
}

export async function saveMonitorScan(data: {
  siteId: string
  siteKey: string
  url: string
  score: number
  previousScore?: number | null
  findings: any[]
  newFindings: any[]
  resolvedFindings: any[]
  summary: any
  performance: any
  ssl: any
  emailSent: boolean
  alertTriggered: boolean
}) {
  const { error } = await supabase.from('monitor_scans').insert({
    site_id: data.siteId,
    site_key: data.siteKey,
    url: data.url,
    score: data.score,
    previous_score: data.previousScore,
    score_delta: data.previousScore != null ? data.score - data.previousScore : null,
    findings: data.findings,
    new_findings: data.newFindings,
    resolved_findings: data.resolvedFindings,
    summary: data.summary,
    performance: data.performance,
    ssl_info: data.ssl,
    email_sent: data.emailSent,
    alert_triggered: data.alertTriggered,
  })
  if (error) console.error('Monitor scan save error:', error)
}

export async function getActiveSitesForMonitoring() {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('connected_sites')
    .select('*')
    .eq('status', 'active')
    .or('last_scan_at.is.null,last_scan_at.lt.' + sixHoursAgo)
  if (error) return []
  return data
}

export async function getSiteScansHistory(siteId: string, limit = 20) {
  const { data } = await supabase
    .from('monitor_scans')
    .select('id, score, previous_score, score_delta, summary, alert_triggered, email_sent, scanned_at')
    .eq('site_id', siteId)
    .order('scanned_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getAllConnectedSites() {
  const { data } = await supabase
    .from('connected_sites')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}
