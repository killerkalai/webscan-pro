import * as cheerio from 'cheerio'
import axios from 'axios'
import { ScanFinding } from '../types'
import { v4 as uuidv4 } from 'uuid'

export async function checkSecurity(
  url: string,
  html: string,
  headers: Record<string, string>
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = []
  const $ = cheerio.load(html)

  // ── XSS Checks ─────────────────────────────────────────────────────────────

  // Forms without output encoding indicators
  const forms = $('form')
  let unsafeInputs = 0
  forms.each((_, form) => {
    const inputs = $(form).find('input[type="text"], input[type="search"], textarea')
    unsafeInputs += inputs.length
  })

  if (unsafeInputs > 0) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'medium',
      title: `${unsafeInputs} Unvalidated Input Field(s) Detected`,
      description: `Found ${unsafeInputs} text input(s) without visible client-side validation. These may be vulnerable to XSS if server-side sanitization is absent.`,
      recommendation: 'Implement input validation and output encoding. Use DOMPurify client-side and a sanitization library server-side (e.g., OWASP Java HTML Sanitizer, bleach for Python).',
      owasp: 'A03:2021 – Injection',
      passed: false,
    })
  }

  // Inline scripts (potential XSS surface)
  const inlineScripts = $('script:not([src])').length
  if (inlineScripts > 5) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'medium',
      title: `Excessive Inline Scripts (${inlineScripts})`,
      description: `Found ${inlineScripts} inline script blocks. Heavy use of inline scripts prevents effective Content-Security-Policy and increases XSS risk.`,
      recommendation: 'Move scripts to external files and use a strict Content-Security-Policy that blocks unsafe-inline.',
      owasp: 'A03:2021 – Injection',
      passed: false,
    })
  }

  // eval() usage in inline scripts
  const scriptContent = $('script:not([src])').text()
  if (scriptContent.includes('eval(') || scriptContent.includes('document.write(')) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'high',
      title: 'Dangerous JavaScript Functions Detected',
      description: 'Found use of eval() or document.write() in page scripts. These functions are commonly exploited for XSS attacks.',
      recommendation: 'Replace eval() with safer alternatives. Avoid document.write(). Use textContent or createElement for dynamic content.',
      owasp: 'A03:2021 – Injection',
      passed: false,
    })
  }

  // ── SQL Injection Indicators ────────────────────────────────────────────────

  // URL parameters that could be SQLi entry points
  const urlObj = new URL(url)
  const params = Array.from(urlObj.searchParams.keys())
  const sqliRiskParams = params.filter(p => /id|user|name|query|search|cat|order|sort|page/i.test(p))

  if (sqliRiskParams.length > 0) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'medium',
      title: `SQL Injection Risk: ${sqliRiskParams.length} Vulnerable-Looking Parameters`,
      description: `URL parameters found that are commonly targeted for SQL injection: ${sqliRiskParams.join(', ')}. Manual testing recommended.`,
      recommendation: 'Use parameterized queries / prepared statements. Never concatenate user input into SQL queries. Use an ORM with built-in escaping.',
      owasp: 'A03:2021 – Injection',
      passed: false,
    })
  }

  // ── CSRF Checks ─────────────────────────────────────────────────────────────

  let csrfIssues = 0
  forms.each((_, form) => {
    const hasMethod = ($(form).attr('method') || 'get').toLowerCase() === 'post'
    if (!hasMethod) return

    const hasCsrfToken = $(form).find(
      'input[name*="csrf"], input[name*="token"], input[name*="_token"], input[name*="authenticity"]'
    ).length > 0

    if (!hasCsrfToken) csrfIssues++
  })

  if (csrfIssues > 0) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'high',
      title: `${csrfIssues} POST Form(s) Missing CSRF Token`,
      description: `Found ${csrfIssues} POST form(s) without a detectable CSRF token. These forms may be vulnerable to Cross-Site Request Forgery attacks.`,
      recommendation: 'Add a unique, unpredictable CSRF token to all state-changing forms. Verify the token server-side on every submission.',
      owasp: 'A01:2021 – Broken Access Control',
      passed: false,
    })
  } else if (forms.length > 0) {
    findings.push({
      id: uuidv4(),
      category: 'security',
      severity: 'pass',
      title: 'CSRF Tokens Detected in Forms',
      description: 'POST forms appear to include CSRF protection tokens.',
      recommendation: '',
      passed: true,
    })
  }

  // ── Mixed Content ────────────────────────────────────────────────────────────

  if (url.startsWith('https://')) {
    const httpAssets = $('[src^="http://"], [href^="http://"]').length
    if (httpAssets > 0) {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'medium',
        title: `Mixed Content: ${httpAssets} Insecure Resource(s)`,
        description: `Found ${httpAssets} resource(s) loaded over HTTP on an HTTPS page. This degrades security and may be blocked by browsers.`,
        recommendation: 'Update all resource URLs to use HTTPS. Use protocol-relative URLs (//) or enforce HTTPS via CSP upgrade-insecure-requests.',
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
    }
  }

  // ── Sensitive Information Exposure ──────────────────────────────────────────

  const pageText = html.toLowerCase()
  const sensitivePatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*['"][a-z0-9_-]{20,}/i, label: 'API Key' },
    { pattern: /password\s*[:=]\s*['"][^'"]{6,}/i, label: 'Hardcoded Password' },
    { pattern: /secret\s*[:=]\s*['"][a-z0-9_-]{16,}/i, label: 'Secret Token' },
    { pattern: /aws_access_key_id/i, label: 'AWS Access Key' },
  ]

  for (const { pattern, label } of sensitivePatterns) {
    if (pattern.test(html)) {
      findings.push({
        id: uuidv4(),
        category: 'security',
        severity: 'critical',
        title: `Possible ${label} Exposed in HTML`,
        description: `Pattern matching a ${label} was found in the page source. This is a critical data exposure vulnerability.`,
        recommendation: `Immediately remove the ${label} from client-side code. Use environment variables server-side. Rotate any exposed credentials.`,
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
    }
  }

  // ── OWASP Top 10 Additional Checks ──────────────────────────────────────────

  // A07: Authentication - check for autocomplete on password fields
  const passwordFields = $('input[type="password"]')
  passwordFields.each((_, el) => {
    if ($(el).attr('autocomplete') !== 'off' && $(el).attr('autocomplete') !== 'new-password') {
      findings.push({
        id: uuidv4(),
        category: 'owasp',
        severity: 'low',
        title: 'Password Autocomplete Not Disabled',
        description: 'Password fields without autocomplete="off" may be cached by browsers, risking credential exposure on shared devices.',
        recommendation: 'Add autocomplete="new-password" or autocomplete="off" to password input fields.',
        owasp: 'A07:2021 – Identification and Authentication Failures',
        passed: false,
      })
      return false // jQuery each break
    }
  })

  // A05: Security Misconfiguration - directory listing clues
  if (html.includes('Index of /') || html.includes('Directory listing')) {
    findings.push({
      id: uuidv4(),
      category: 'owasp',
      severity: 'high',
      title: 'Directory Listing Enabled',
      description: 'The server appears to have directory listing enabled, exposing file and folder structure to attackers.',
      recommendation: 'Disable directory listing in your web server. In nginx: autoindex off; In Apache: Options -Indexes',
      owasp: 'A05:2021 – Security Misconfiguration',
      passed: false,
    })
  }

  // A09: Security Logging - check for error details in page
  if (html.includes('stack trace') || html.includes('SQLException') || html.includes('at System.Web')) {
    findings.push({
      id: uuidv4(),
      category: 'owasp',
      severity: 'high',
      title: 'Stack Trace / Error Details Exposed',
      description: 'The page appears to expose server-side error details or stack traces, revealing implementation details to attackers.',
      recommendation: 'Configure custom error pages and disable detailed error reporting in production. Never expose stack traces to end users.',
      owasp: 'A09:2021 – Security Logging and Monitoring Failures',
      passed: false,
    })
  }

  return findings
}
