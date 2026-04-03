import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { checkSSL } from '@/lib/scanners/ssl'
import { checkHeaders } from '@/lib/scanners/headers'
import { checkSecurity } from '@/lib/scanners/security'
import { checkLinks } from '@/lib/scanners/links'
import { findOwnerContact } from '@/lib/scanners/whois'
import { sendScanReport } from '@/lib/email/sendReport'
import { ScanFinding, ScanResult, ScanRequest } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body: ScanRequest = await req.json()
  const { url: rawUrl, ownerEmail, sendEmail = true } = body

  // Validate URL
  let url: string
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    url = parsed.href
  } catch {
    return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 })
  }

  const startTime = Date.now()
  const scanId = uuidv4()
  const allFindings: ScanFinding[] = []

  try {
    // Fetch page HTML
    let html = ''
    try {
      const resp = await axios.get(url, {
        timeout: 15000,
        validateStatus: () => true,
        headers: { 'User-Agent': 'WebScanPro/1.0 (Security Scanner)' },
      })
      html = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data)
    } catch (err) {
      return NextResponse.json({ error: 'Could not fetch the website. Is it publicly accessible?' }, { status: 422 })
    }

    // Run all scanners in parallel
    const [
      sslResult,
      headerResult,
      linkResult,
    ] = await Promise.all([
      checkSSL(url),
      checkHeaders(url),
      checkLinks(url, html),
    ])

    // Security scan (needs headers + html)
    const securityFindings = await checkSecurity(url, html, headerResult.headers)

    // Collect all findings
    allFindings.push(
      ...sslResult.findings,
      ...headerResult.findings,
      ...securityFindings,
      ...linkResult.findings,
    )

    // Find owner contact
    const ownerContact = await findOwnerContact(url, html, ownerEmail)

    // Calculate score
    const score = calculateScore(allFindings)

    // Summary
    const summary = {
      critical: allFindings.filter(f => f.severity === 'critical' && !f.passed).length,
      high: allFindings.filter(f => f.severity === 'high' && !f.passed).length,
      medium: allFindings.filter(f => f.severity === 'medium' && !f.passed).length,
      low: allFindings.filter(f => f.severity === 'low' && !f.passed).length,
      info: allFindings.filter(f => f.severity === 'info').length,
      passed: allFindings.filter(f => f.passed).length,
    }

    const durationMs = Date.now() - startTime

    // Send email notification
    let emailSent = false
    let emailSentTo: string | undefined

    if (sendEmail && ownerContact.email) {
      const emailResult = await sendScanReport(ownerContact.email, {
        id: scanId,
        url,
        scannedAt: new Date().toISOString(),
        durationMs,
        score,
        findings: allFindings,
        ssl: sslResult.info,
        performance: headerResult.performance,
        brokenLinks: linkResult.results.filter(r => !r.ok),
        ownerContact,
        emailSent: false,
        summary,
      })
      emailSent = emailResult.success
      if (emailSent) emailSentTo = ownerContact.email
    }

    const result: ScanResult = {
      id: scanId,
      url,
      scannedAt: new Date().toISOString(),
      durationMs,
      score,
      findings: allFindings,
      ssl: sslResult.info,
      performance: headerResult.performance,
      brokenLinks: linkResult.results.filter(r => !r.ok),
      ownerContact,
      emailSent,
      emailSentTo,
      summary,
    }

    return NextResponse.json(result)

  } catch (err: any) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: `Scan failed: ${err.message}` }, { status: 500 })
  }
}

function calculateScore(findings: ScanFinding[]): number {
  const penalties: Record<string, number> = {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
    info: 0,
    pass: 0,
  }

  let score = 100
  for (const finding of findings) {
    if (!finding.passed) {
      score -= (penalties[finding.severity] || 0)
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}
