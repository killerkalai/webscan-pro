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
        description: 'The website is served over HTTP instead of HTTPS, exposing all data in transit to interception.',
        recommendation: 'Obtain an SSL/TLS certificate and configure a redirect from HTTP to HTTPS. Use Let\'s Encrypt for free certificates.',
        owasp: 'A02:2021 – Cryptographic Failures',
        passed: false,
      })
      return { info: { valid: false }, findings }
    }

    // Use ssl-checker package
    const sslChecker = (await import('ssl-checker')).default
    const hostname = parsedUrl.hostname

    try {
      const sslData = await sslChecker(hostname, { method: 'GET', port: 443 })
      const daysRemaining = sslData.daysRemaining ?? 0

      info = {
        valid: sslData.valid,
        daysRemaining,
        validFrom: sslData.validFrom,
        validTo: sslData.validTo,
      }

      // Check certificate validity
      if (!sslData.valid) {
        findings.push({
          id: uuidv4(),
          category: 'ssl',
          severity: 'critical',
          title: 'Invalid SSL Certificate',
          description: 'The SSL certificate is invalid, expired, or self-signed. Browsers will show security warnings.',
          recommendation: 'Renew or replace the SSL certificate immediately. Use a trusted CA like Let\'s Encrypt, DigiCert, or Comodo.',
          owasp: 'A02:2021 – Cryptographic Failures',
          passed: false,
        })
      } else if (daysRemaining < 7) {
        findings.push({
          id: uuidv4(),
          category: 'ssl',
          severity: 'critical',
          title: `SSL Certificate Expiring in ${daysRemaining} Days`,
          description: `The SSL certificate expires in ${daysRemaining} days. Failure to renew will cause browser security errors.`,
          recommendation: 'Renew the certificate immediately. Consider enabling auto-renewal via Certbot or your hosting provider.',
          passed: false,
        })
      } else if (daysRemaining < 30) {
        findings.push({
          id: uuidv4(),
          category: 'ssl',
          severity: 'medium',
          title: `SSL Certificate Expiring in ${daysRemaining} Days`,
          description: `Certificate will expire soon. Plan renewal to avoid service disruption.`,
          recommendation: 'Schedule certificate renewal before expiry. Enable auto-renewal to prevent this in the future.',
          passed: false,
        })
      } else {
        findings.push({
          id: uuidv4(),
          category: 'ssl',
          severity: 'pass',
          title: 'SSL Certificate Valid',
          description: `Certificate is valid for ${daysRemaining} more days.`,
          recommendation: '',
          passed: true,
        })
      }
    } catch (sslError) {
      findings.push({
        id: uuidv4(),
        category: 'ssl',
        severity: 'high',
        title: 'SSL Certificate Check Failed',
        description: 'Could not verify the SSL certificate. The certificate may be invalid or misconfigured.',
        recommendation: 'Verify SSL configuration at your hosting provider or use SSL Labs (ssllabs.com) for a detailed report.',
        passed: false,
      })
    }
  } catch (err) {
    console.error('SSL check error:', err)
  }

  return { info, findings }
}
