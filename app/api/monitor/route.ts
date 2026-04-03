import { NextRequest, NextResponse } from 'next/server'
import { getSiteByKey, updateSiteStatus, saveMonitorScan } from '@/lib/db/supabase'
import { checkSSL } from '@/lib/scanners/ssl'
import { checkHeaders } from '@/lib/scanners/headers'
import { checkSecurity } from '@/lib/scanners/security'
import { checkLinks } from '@/lib/scanners/links'
import { sendAlertEmail } from '@/lib/email/sendAlert'
import { ScanFinding } from '@/lib/types'
import axios from 'axios'

export const runtime = 'nodejs'
export const maxDuration = 60

// GET — called by monitor.js on page load (script verification ping)
export async function GET(req: NextRequest) {
  const siteKey = req.nextUrl.searchParams.get('key')
  const origin = req.headers.get('origin') || req.headers.get('referer') || ''

  if (!siteKey) {
    return NextResponse.json({ error: 'Missing site key' }, { status: 400 })
  }

  const site = await getSiteByKey(siteKey)
  if (!site) {
    return NextResponse.json({ error: 'Unknown site key' }, { status: 404 })
  }

  // Mark script as verified (it pinged us from the real site)
  if (!site.script_verified) {
    await updateSiteStatus(siteKey, { script_verified: true, status: 'active' })
  }

  // Trigger a background scan if it's been > 6 hours (or first scan)
  const shouldScan = !site.last_scan_at ||
    (Date.now() - new Date(site.last_scan_at).getTime()) > 6 * 60 * 60 * 1000

  if (shouldScan) {
    // Don't await — return immediately to the client, run scan in background
    runMonitorScan(site).catch(console.error)
  }

  return NextResponse.json(
    { ok: true, monitored: true, verified: true },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      }
    }
  )
}

// POST — manually trigger a scan for a site key
export async function POST(req: NextRequest) {
  const { key } = await req.json()
  const site = await getSiteByKey(key)
  if (!site) return NextResponse.json({ error: 'Unknown site key' }, { status: 404 })

  const result = await runMonitorScan(site)
  return NextResponse.json(result)
}

// ── Core scan runner ────────────────────────────────────────────────────────

async function runMonitorScan(site: any) {
  const { id: siteId, site_key: siteKey, url, owner_email: ownerEmail,
    last_score: previousScore, alert_frequency: alertFrequency } = site

  try {
    // Fetch HTML
    let html = ''
    try {
      const resp = await axios.get(url, {
        timeout: 15000,
        validateStatus: () => true,
        headers: { 'User-Agent': 'WebScanPro-Monitor/1.0' },
      })
      html = typeof resp.data === 'string' ? resp.data : ''
    } catch { /* unreachable site */ }

    // Run all scanners in parallel
    const [sslResult, headerResult, linkResult] = await Promise.all([
      checkSSL(url),
      checkHeaders(url),
      checkLinks(url, html),
    ])
    const securityFindings = await checkSecurity(url, html, headerResult.headers)

    const allFindings: ScanFinding[] = [
      ...sslResult.findings,
      ...headerResult.findings,
      ...securityFindings,
      ...linkResult.findings,
    ]

    // Score
    const score = calculateScore(allFindings)

    const summary = {
      critical: allFindings.filter(f => f.severity === 'critical' && !f.passed).length,
      high: allFindings.filter(f => f.severity === 'high' && !f.passed).length,
      medium: allFindings.filter(f => f.severity === 'medium' && !f.passed).length,
      low: allFindings.filter(f => f.severity === 'low' && !f.passed).length,
      info: allFindings.filter(f => f.severity === 'info').length,
      passed: allFindings.filter(f => f.passed).length,
    }

    // Detect NEW findings vs previous scan (by title fingerprint)
    const newFindings = previousScore != null
      ? allFindings.filter(f => !f.passed) // simplified — full diff needs stored finding IDs
      : allFindings.filter(f => !f.passed)

    // Decide if alert should fire
    const scoreDrop = previousScore != null ? previousScore - score : 0
    const hasCritical = summary.critical > 0
    const hasNewHighPlus = newFindings.some(f => ['critical', 'high'].includes(f.severity))

    const shouldAlert =
      alertFrequency === 'realtime' && (hasCritical || hasNewHighPlus || scoreDrop >= 10) ||
      alertFrequency === 'daily' ||
      previousScore == null // always alert on first scan

    let emailSent = false
    if (shouldAlert && ownerEmail) {
      const result = await sendAlertEmail({
        to: ownerEmail,
        site,
        score,
        previousScore,
        scoreDelta: previousScore != null ? score - previousScore : null,
        newFindings: newFindings.filter(f => ['critical', 'high', 'medium'].includes(f.severity)),
        allFindings,
        summary,
        performance: headerResult.performance,
        ssl: sslResult.info,
      })
      emailSent = result.success

      if (emailSent) {
        await updateSiteStatus(siteKey, { last_alert_sent_at: new Date().toISOString() })
      }
    }

    // Save scan record
    await saveMonitorScan({
      siteId,
      siteKey,
      url,
      score,
      previousScore,
      findings: allFindings,
      newFindings,
      resolvedFindings: [],
      summary,
      performance: headerResult.performance,
      ssl: sslResult.info,
      emailSent,
      alertTriggered: shouldAlert,
    })

    // Update site record
    await updateSiteStatus(siteKey, {
      last_scan_at: new Date().toISOString(),
      last_score: score,
      status: 'active',
      consecutive_failures: 0,
    })

    return { success: true, score, summary, emailSent }
  } catch (err: any) {
    console.error('Monitor scan error:', err)
    await updateSiteStatus(siteKey, {
      status: 'error',
      consecutive_failures: (site.consecutive_failures || 0) + 1,
    })
    return { success: false, error: err.message }
  }
}

function calculateScore(findings: ScanFinding[]): number {
  const penalties: Record<string, number> = {
    critical: 20, high: 10, medium: 5, low: 2, info: 0, pass: 0,
  }
  let score = 100
  for (const f of findings) {
    if (!f.passed) score -= (penalties[f.severity] || 0)
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}
