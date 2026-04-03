import { Resend } from 'resend'
import { ScanFinding } from '../types'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AlertEmailData {
  to: string
  site: any
  score: number
  previousScore: number | null
  scoreDelta: number | null
  newFindings: ScanFinding[]
  allFindings: ScanFinding[]
  summary: any
  performance: any
  ssl: any
}

export async function sendAlertEmail(data: AlertEmailData): Promise<{ success: boolean }> {
  const { to, site, score, previousScore, scoreDelta, newFindings, summary } = data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webscanpro.com'

  const isFirstScan = previousScore == null
  const scoreColor = score >= 80 ? '#00FF88' : score >= 50 ? '#FFB800' : '#FF3B5C'
  const deltaText = scoreDelta != null
    ? scoreDelta > 0 ? `▲ +${scoreDelta} improved` : scoreDelta < 0 ? `▼ ${scoreDelta} dropped` : '— unchanged'
    : 'First scan'
  const deltaColor = scoreDelta != null && scoreDelta < 0 ? '#FF3B5C' : '#00FF88'

  const urgency = summary.critical > 0
    ? '🚨 CRITICAL issues detected'
    : summary.high > 0
    ? '⚠️ High severity issues detected'
    : isFirstScan
    ? '🛡️ First security scan complete'
    : '📋 Security scan update'

  const findingRows = newFindings
    .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity))
    .slice(0, 10)
    .map(f => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #1C2333;">
          <span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;${severityStyle(f.severity)}">${f.severity.toUpperCase()}</span>
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #1C2333;font-size:13px;">
          <strong style="color:#E2E8F0;">${escapeHtml(f.title)}</strong>
          <div style="color:#8892A4;font-size:12px;margin-top:2px;">${escapeHtml(f.recommendation?.slice(0, 120) || '')}${(f.recommendation?.length || 0) > 120 ? '…' : ''}</div>
        </td>
      </tr>`).join('')

  try {
    const { error } = await resend.emails.send({
      from: 'WebScan Pro Alerts <alerts@webscanpro.com>',
      to,
      subject: `${urgency} — ${site.url}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080B0F;font-family:'Helvetica Neue',Arial,sans-serif;color:#E2E8F0;">
<div style="max-width:640px;margin:0 auto;padding:24px;">

  <!-- Alert banner -->
  <div style="background:${summary.critical > 0 ? 'rgba(255,59,92,0.08)' : 'rgba(0,255,136,0.05)'};border:1px solid ${summary.critical > 0 ? 'rgba(255,59,92,0.3)' : 'rgba(0,255,136,0.2)'};border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center;">
    <div style="font-size:28px;margin-bottom:8px;">${summary.critical > 0 ? '🚨' : summary.high > 0 ? '⚠️' : '🛡️'}</div>
    <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;">${urgency}</h1>
    <p style="margin:0;color:#8892A4;font-size:13px;font-family:monospace;">${escapeHtml(site.url)}</p>
  </div>

  <!-- Score card -->
  <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
    <div>
      <p style="margin:0 0 4px;color:#8892A4;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Security Score</p>
      <div style="font-size:40px;font-weight:800;color:${scoreColor};line-height:1;">${score}<span style="font-size:18px;color:#4A5568;">/100</span></div>
      <p style="margin:4px 0 0;font-size:13px;color:${deltaColor};">${deltaText}</p>
    </div>
    <div style="text-align:right;">
      ${summary.critical > 0 ? `<div style="margin-bottom:4px;"><span style="background:rgba(255,59,92,0.15);color:#FF3B5C;border:1px solid rgba(255,59,92,0.3);padding:4px 12px;border-radius:6px;font-weight:700;">${summary.critical} CRITICAL</span></div>` : ''}
      ${summary.high > 0 ? `<div style="margin-bottom:4px;"><span style="background:rgba(255,100,0,0.15);color:#FF6400;border:1px solid rgba(255,100,0,0.3);padding:4px 12px;border-radius:6px;font-weight:700;">${summary.high} HIGH</span></div>` : ''}
      ${summary.medium > 0 ? `<div><span style="background:rgba(255,184,0,0.15);color:#FFB800;border:1px solid rgba(255,184,0,0.3);padding:4px 12px;border-radius:6px;font-weight:700;">${summary.medium} MEDIUM</span></div>` : ''}
    </div>
  </div>

  <!-- Findings table -->
  ${newFindings.length > 0 ? `
  <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;overflow:hidden;margin-bottom:20px;">
    <div style="padding:14px 20px;border-bottom:1px solid #1C2333;background:#080B0F;">
      <p style="margin:0;font-size:12px;color:#8892A4;text-transform:uppercase;letter-spacing:0.05em;">${isFirstScan ? 'All Findings' : 'Issues Requiring Attention'}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${findingRows}
    </table>
  </div>` : ''}

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:20px;">
    <a href="${appUrl}/sites/${site.site_key}"
       style="display:inline-block;padding:12px 32px;background:#00FF88;color:#080B0F;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:8px;">
      View Full Report →
    </a>
    <p style="margin:8px 0 0;font-size:12px;color:#4A5568;">Scanned: ${new Date().toLocaleString()} UTC</p>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding-top:16px;border-top:1px solid #1C2333;">
    <p style="margin:0 0 4px;font-size:12px;color:#4A5568;">WebScan Pro — Monitoring ${escapeHtml(site.url)}</p>
    <p style="margin:0;font-size:11px;color:#4A5568;">
      <a href="${appUrl}/sites/${site.site_key}?action=pause" style="color:#4A5568;">Pause alerts</a>
      &nbsp;·&nbsp;
      <a href="${appUrl}/sites/${site.site_key}?action=disconnect" style="color:#4A5568;">Disconnect site</a>
    </p>
  </div>

</div>
</body>
</html>`,
    })

    if (error) {
      console.error('Alert email error:', error)
      return { success: false }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Alert email exception:', err)
    return { success: false }
  }
}

function severityOrder(s: string): number {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4, pass: 5 }[s] ?? 6
}

function severityStyle(s: string): string {
  const map: Record<string, string> = {
    critical: 'background:rgba(255,59,92,0.15);color:#FF3B5C;',
    high: 'background:rgba(255,100,0,0.15);color:#FF6400;',
    medium: 'background:rgba(255,184,0,0.15);color:#FFB800;',
    low: 'background:rgba(0,255,136,0.1);color:#00FF88;',
  }
  return map[s] || ''
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
