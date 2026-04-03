import axios from 'axios'
import { ScanFinding, PerformanceInfo } from '../types'
import { v4 as uuidv4 } from 'uuid'

const SECURITY_HEADERS = [
  {
    name: 'Content-Security-Policy',
    key: 'content-security-policy',
    severity: 'high' as const,
    description: 'CSP prevents XSS attacks by whitelisting trusted content sources.',
    recommendation: "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self'",
    owasp: 'A03:2021 – Injection',
  },
  {
    name: 'X-Frame-Options',
    key: 'x-frame-options',
    severity: 'medium' as const,
    description: 'Prevents clickjacking attacks by controlling iframe embedding.',
    recommendation: 'Add X-Frame-Options: SAMEORIGIN or DENY to prevent clickjacking.',
  },
  {
    name: 'X-Content-Type-Options',
    key: 'x-content-type-options',
    severity: 'medium' as const,
    description: 'Prevents MIME-type sniffing attacks.',
    recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME sniffing.',
  },
  {
    name: 'Strict-Transport-Security',
    key: 'strict-transport-security',
    severity: 'high' as const,
    description: 'HSTS forces HTTPS connections, preventing protocol downgrade attacks.',
    recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    name: 'Permissions-Policy',
    key: 'permissions-policy',
    severity: 'low' as const,
    description: 'Controls browser feature permissions (camera, microphone, geolocation).',
    recommendation: 'Add a Permissions-Policy header to restrict unnecessary browser APIs.',
  },
  {
    name: 'Referrer-Policy',
    key: 'referrer-policy',
    severity: 'low' as const,
    description: 'Controls referrer information sent with requests.',
    recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin',
  },
]

export async function checkHeaders(url: string): Promise<{
  findings: ScanFinding[]
  performance: PerformanceInfo | null
  headers: Record<string, string>
}> {
  const findings: ScanFinding[] = []
  let performance: PerformanceInfo | null = null
  let headers: Record<string, string> = {}

  try {
    const startTime = Date.now()
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'WebScanPro/1.0 (Security Scanner; +https://webscanpro.com)',
      },
    })
    const responseTime = Date.now() - startTime

    headers = Object.fromEntries(
      Object.entries(response.headers).map(([k, v]) => [k, String(v)])
    )

    const contentLength = parseInt(headers['content-length'] || '0')
    const encoding = headers['content-encoding'] || ''

    performance = {
      responseTimeMs: responseTime,
      contentSizeKb: Math.round(contentLength / 1024),
      compressionEnabled: encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate'),
      httpVersion: response.request?.res?.httpVersion || '1.1',
      serverHeader: headers['server'],
    }

    // Performance findings
    if (responseTime > 3000) {
      findings.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'high',
        title: `Slow Response Time: ${responseTime}ms`,
        description: `The server responded in ${responseTime}ms. Google recommends under 200ms for Time to First Byte (TTFB).`,
        recommendation: 'Enable server-side caching, use a CDN, optimize database queries, and upgrade hosting if needed.',
        passed: false,
      })
    } else if (responseTime > 1000) {
      findings.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'medium',
        title: `Response Time Could Be Improved: ${responseTime}ms`,
        description: `Response time is acceptable but could be faster. Target under 200ms for optimal user experience.`,
        recommendation: 'Consider implementing caching (Redis, Varnish) or a CDN like Cloudflare.',
        passed: false,
      })
    } else {
      findings.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'pass',
        title: `Good Response Time: ${responseTime}ms`,
        description: 'Server response time is within acceptable range.',
        recommendation: '',
        passed: true,
      })
    }

    // Compression check
    if (!performance.compressionEnabled) {
      findings.push({
        id: uuidv4(),
        category: 'performance',
        severity: 'medium',
        title: 'HTTP Compression Not Enabled',
        description: 'Response is not compressed with gzip or Brotli, increasing bandwidth usage and load times.',
        recommendation: 'Enable gzip or Brotli compression in your web server (nginx: gzip on; Apache: mod_deflate).',
        passed: false,
      })
    }

    // Server header exposes version info
    if (headers['server'] && /\d+\.\d+/.test(headers['server'])) {
      findings.push({
        id: uuidv4(),
        category: 'security',
        severity: 'medium',
        title: 'Server Version Disclosed in Header',
        description: `The Server header reveals software version: "${headers['server']}". This helps attackers target known CVEs.`,
        recommendation: "Remove or genericize the Server header. In nginx: server_tokens off; In Apache: ServerTokens Prod",
        owasp: 'A05:2021 – Security Misconfiguration',
        passed: false,
      })
    }

    // X-Powered-By header
    if (headers['x-powered-by']) {
      findings.push({
        id: uuidv4(),
        category: 'security',
        severity: 'low',
        title: 'Technology Stack Exposed via X-Powered-By',
        description: `X-Powered-By header reveals: "${headers['x-powered-by']}". This fingerprints your tech stack.`,
        recommendation: 'Remove X-Powered-By header. In Express.js: app.disable("x-powered-by")',
        owasp: 'A05:2021 – Security Misconfiguration',
        passed: false,
      })
    }

    // Check security headers
    for (const header of SECURITY_HEADERS) {
      const present = headers[header.key] !== undefined

      findings.push({
        id: uuidv4(),
        category: 'headers',
        severity: present ? 'pass' : header.severity,
        title: present ? `${header.name} Present` : `Missing ${header.name} Header`,
        description: present
          ? `${header.name} header is properly configured: "${String(headers[header.key]).substring(0, 80)}"`
          : `${header.description}`,
        recommendation: present ? '' : header.recommendation,
        owasp: header.owasp,
        passed: present,
      })
    }

  } catch (err: any) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'critical',
      title: 'Failed to Connect to Server',
      description: `Could not establish connection to ${url}. Error: ${err.message}`,
      recommendation: 'Verify the URL is correct and the server is accessible.',
      passed: false,
    })
  }

  return { findings, performance, headers }
}
