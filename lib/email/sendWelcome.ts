import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface WelcomeEmailData {
  to: string
  ownerName?: string
  url: string
  siteKey: string
  snippet: string
  appUrl: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { to, ownerName, url, siteKey, snippet, appUrl } = data
  const name = ownerName || 'there'

  try {
    await resend.emails.send({
      from: 'WebScan Pro <hello@webscanpro.com>',
      to,
      subject: `🛡️ Connect WebScan Pro to ${url}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080B0F;font-family:'Helvetica Neue',Arial,sans-serif;color:#E2E8F0;">
<div style="max-width:600px;margin:0 auto;padding:24px;">

  <!-- Header -->
  <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:32px;margin-bottom:20px;text-align:center;">
    <div style="font-size:32px;margin-bottom:12px;">🛡️</div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E2E8F0;">You're almost set, ${name}!</h1>
    <p style="margin:0;color:#8892A4;font-size:14px;">One snippet away from 24/7 security monitoring</p>
  </div>

  <!-- Step 1 -->
  <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:28px;height:28px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:700;color:#00FF88;">1</div>
      <h2 style="margin:0;font-size:16px;font-weight:600;">Add this snippet to your site</h2>
    </div>
    <p style="margin:0 0 12px;color:#8892A4;font-size:13px;">Paste this before the closing <code style="color:#00FF88;">&lt;/head&gt;</code> tag on every page:</p>
    <div style="background:#080B0F;border:1px solid #1C2333;border-radius:8px;padding:16px;font-family:'JetBrains Mono',monospace;font-size:12px;color:#8892A4;white-space:pre-wrap;word-break:break-all;">${escapeHtml(snippet)}</div>
  </div>

  <!-- Step 2 -->
  <div style="background:#0D1117;border:1px solid #1C2333;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="width:28px;height:28px;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:700;color:#00FF88;">2</div>
      <h2 style="margin:0;font-size:16px;font-weight:600;">That's it!</h2>
    </div>
    <p style="margin:0;color:#8892A4;font-size:14px;">Once the script is live, WebScan Pro will automatically:</p>
    <ul style="margin:12px 0 0;padding-left:20px;color:#8892A4;font-size:13px;line-height:1.8;">
      <li>Verify the connection on your next page load</li>
      <li>Run a full security scan (SSL, XSS, CSRF, broken links, OWASP Top 10)</li>
      <li>Email you immediately if critical or high severity issues are found</li>
      <li>Re-scan every 6 hours and alert on new findings</li>
    </ul>
  </div>

  <!-- Dashboard link -->
  <div style="background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.2);border-radius:12px;padding:20px;margin-bottom:16px;text-align:center;">
    <p style="margin:0 0 12px;font-size:14px;color:#E2E8F0;">View your security dashboard anytime:</p>
    <a href="${appUrl}/sites/${siteKey}"
       style="display:inline-block;padding:10px 24px;background:#00FF88;color:#080B0F;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">
      Open Dashboard →
    </a>
  </div>

  <!-- Site key -->
  <div style="text-align:center;padding:16px;">
    <p style="margin:0;font-size:12px;color:#4A5568;font-family:monospace;">Site Key: ${siteKey}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#4A5568;">Keep this safe — it's your unique identifier</p>
  </div>

</div>
</body>
</html>`,
    })
    return { success: true }
  } catch (err: any) {
    console.error('Welcome email error:', err)
    return { success: false }
  }
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
