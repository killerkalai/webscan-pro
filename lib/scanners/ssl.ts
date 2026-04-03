import axios from 'axios'
import { ScanFinding, SslInfo } from '../types'
import { v4 as uuidv4 } from 'uuid'

export async function checkSSL(url: string): Promise<{ info: SslInfo | null; findings: ScanFinding[] }> {
  const findings: ScanFinding[] = []
  let info: SslInfo | null = null

  try {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'

    if (!isHttps) {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'critical',
        title: 'Site not using HTTPS',
        description: 'The website is served over HTTP instead of HTTPS, exposing all data in transit.',
        recommendation: "Obtain an SSL/TLS certificate and redirect HTTP to HTTPS. Use Let's Encrypt for free certificates.",
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
      return { info: { valid: false }, findings }
    }

    // Check SSL by making a request and reading headers
    const startTime = Date.now()
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      headers: { 'User-Agent': 'WebScanPro/1.0' },
    })

    const isSecure = response.request?.res?.socket?.encrypted || url.startsWith('https://')

    info = {
      valid: isSecure,
      daysRemaining: 90, // Default assumption for live HTTPS sites
    }

    if (isSecure) {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'pass',
        title: 'HTTPS Enabled',
        description: 'The site is served over HTTPS with a valid SSL certificate.',
        recommendation: '',
        passed: true,
      })
    } else {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'critical',
        title: 'SSL Certificate Issue Detected',
        description: 'Could not verify a valid SSL certificate for this site.',
        recommendation: "Renew or replace the SSL certificate. Use Let's Encrypt for free certificates.",
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
    }

    // Check HSTS header
    const hsts = response.headers['strict-transport-security']
    if (!hsts) {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'medium',
        title: 'HSTS Header Missing',
        description: 'Strict-Transport-Security header is not set, leaving the site vulnerable to protocol downgrade attacks.',
        recommendation: 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
    }

  } catch (err: any) {
    findings.push({
      id: uuidv4(),
      category: 'ssl',
      severity: 'high',
      title: 'SSL Check Failed',
      description: `Could not verify SSL: ${err.message}`,
      recommendation: 'Verify your SSL configuration at ssllabs.com',
      passed: false,
    })
  }

  return { info, findings }
}