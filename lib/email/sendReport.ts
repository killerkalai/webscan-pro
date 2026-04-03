import { Resend } from 'resend'
import { ScanResult, ScanFinding } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendScanReport(
  to: string,
  result: ScanResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WebScan Pro <reports@webscanpro.com>',
      to,
      subject: `Security Scan Report: ${result.url} — Score ${result.score}/100`,
      html: buildEmailHtml(result),
      text: buildEmailText(result),
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

function buildEmailHtml(result: ScanResult): string {
  const scoreColor = result.score >= 80 ? '#00FF88' : result.score >= 50 ? '#FFB800' : '#FF3B5C'
  const criticalFindings = result.findings.filter(f => f.severity === 'critical' && !f.passed)
  const highFindings = result.findings.filter(f => f.severity === 'high' && !f.passed)

  const findingRows = result.findings
    .filter(f => !f.passed)
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
    .slice(0, 15)
    .map(f => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #1C2333;">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;${severityStyle(f.severity)}">${f.severity.toUpperCase()}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #1C2333;font-weight:500;">${escapeHtml(f.title)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1C2333;color:#8892A4;font-size:13px;">${escapeHtml(f.category)}</td>
      </tr>
    `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080B0F;font-family:'Helvetica Neue',Arial,sans-serif;color:#E2E8F0;">
  <div style="max-width:680px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:32px;margin-bottom:20px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:24px;">🛡️</span>
      </div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#E2E8F0;">Security Scan Report</h1>
      <p style="margin:0;color:#8892A4;font-size:14px;">Automated scan by WebScan Pro</p>
    </div>

    <!-- Score card -->
    <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div>
          <p style="margin:0 0 4px;color:#8892A4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Scanned URL</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#E2E8F0;">${escapeHtml(result.url)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#8892A4;">Scanned: ${new Date(result.scannedAt).toLocaleString()}</p>
        </div>
        <div style="text-align:center;">
          <div style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${result.score}</div>
          <div style="font-size:12px;color:#8892A4;">/ 100</div>
        </div>
      </div>
    </div>

    <!-- Summary badges -->
    <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 16px;font-size:12px;color:#8892A4;text-transform:uppercase;letter-spacing:0.05em;">Finding Summary</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${result.summary.critical > 0 ? `<div style="background:rgba(255,59,92,0.15);border:1px solid rgba(255,59,92,0.3);border-radius:6px;padding:8px 16px;"><div style="font-size:20px;font-weight:700;color:#FF3B5C;">${result.summary.critical}</div><div style="font-size:11px;color:#FF3B5C;">CRITICAL</div></div>` : ''}
        ${result.summary.high > 0 ? `<div style="background:rgba(255,100,0,0.15);border:1px solid rgba(255,100,0,0.3);border-radius:6px;padding:8px 16px;"><div style="font-size:20px;font-weight:700;color:#FF6400;">${result.summary.high}</div><div style="font-size:11px;color:#FF6400;">HIGH</div></div>` : ''}
        ${result.summary.medium > 0 ? `<div style="background:rgba(255,184,0,0.15);border:1px solid rgba(255,184,0,0.3);border-radius:6px;padding:8px 16px;"><div style="font-size:20px;font-weight:700;color:#FFB800;">${result.summary.medium}</div><div style="font-size:11px;color:#FFB800;">MEDIUM</div></div>` : ''}
        ${result.summary.low > 0 ? `<div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);border-radius:6px;padding:8px 16px;"><div style="font-size:20px;font-weight:700;color:#00FF88;">${result.summary.low}</div><div style="font-size:11px;color:#00FF88;">LOW</div></div>` : ''}
        <div style="background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.15);border-radius:6px;padding:8px 16px;"><div style="font-size:20px;font-weight:700;color:#4A5568;">${result.summary.passed}</div><div style="font-size:11px;color:#4A5568;">PASSED</div></div>
      </div>
    </div>

    ${criticalFindings.length > 0 ? `
    <!-- Critical alert -->
    <div style="background:rgba(255,59,92,0.08);border:1px solid rgba(255,59,92,0.3);border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-weight:600;color:#FF3B5C;">⚠️ ${criticalFindings.length} Critical Issue(s) Require Immediate Attention</p>
      ${criticalFindings.map(f => `<p style="margin:0 0 8px;font-size:14px;color:#E2E8F0;">• <strong>${escapeHtml(f.title)}</strong>: ${escapeHtml(f.recommendation)}</p>`).join('')}
    </div>` : ''}

    <!-- Findings table -->
    <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <div style="padding:16px 20px;border-bottom:1px solid #1C2333;">
        <p style="margin:0;font-size:12px;color:#8892A4;text-transform:uppercase;letter-spacing:0.05em;">Top Findings</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#080B0F;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#4A5568;text-transform:uppercase;font-weight:500;">Severity</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#4A5568;text-transform:uppercase;font-weight:500;">Issue</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;color:#4A5568;text-transform:uppercase;font-weight:500;">Category</th>
          </tr>
        </thead>
        <tbody>${findingRows}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#4A5568;">This report was generated by WebScan Pro — Automated Security Scanner</p>
      <p style="margin:0;font-size:12px;color:#4A5568;">This is an automated scan. Results should be verified by a security professional.</p>
    </div>

  </div>
</body>
</html>
  `
}

function buildEmailText(result: ScanResult): string {
  const issues = result.findings.filter(f => !f.passed)
  return `
WebScan Pro — Security Report
==============================
URL: ${result.url}
Score: ${result.score}/100
Scanned: ${new Date(result.scannedAt).toLocaleString()}

SUMMARY
Critical: ${result.summary.critical}
High:     ${result.summary.high}
Medium:   ${result.summary.medium}
Low:      ${result.summary.low}
Passed:   ${result.summary.passed}

TOP ISSUES
${issues.slice(0, 10).map(f => `[${f.severity.toUpperCase()}] ${f.title}\n  → ${f.recommendation}`).join('\n\n')}

--
This is an automated report from WebScan Pro.
Always verify findings with a qualified security professional.
  `.trim()
}

function severityOrder(s: string): number {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4, pass: 5 }[s] ?? 6
}

function severityStyle(s: string): string {
  const styles: Record<string, string> = {
    critical: 'background:rgba(255,59,92,0.15);color:#FF3B5C;',
    high: 'background:rgba(255,100,0,0.15);color:#FF6400;',
    medium: 'background:rgba(255,184,0,0.15);color:#FFB800;',
    low: 'background:rgba(0,255,136,0.1);color:#00FF88;',
    info: 'background:rgba(59,130,246,0.15);color:#3B82F6;',
  }
  return styles[s] || ''
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
