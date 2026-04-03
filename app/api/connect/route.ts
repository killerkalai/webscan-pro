import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { registerSite, getSiteByKey } from '@/lib/db/supabase'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url: rawUrl, ownerEmail, ownerName, alertFrequency = 'realtime' } = body

    // Validate
    if (!rawUrl || !ownerEmail) {
      return NextResponse.json({ error: 'url and ownerEmail are required' }, { status: 400 })
    }

    let url: string
    try {
      url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).origin
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Generate unique site key
    const siteKey = `wsp_${uuidv4().replace(/-/g, '').substring(0, 24)}`

    // Save to DB
    const site = await registerSite({ siteKey, url, ownerEmail, ownerName, alertFrequency })

    // Build the embed snippet
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webscanpro.com'
    const snippet = buildSnippet(siteKey, appUrl)

    // Send welcome email with installation instructions
    await sendWelcomeEmail({ to: ownerEmail, ownerName, url, siteKey, snippet, appUrl })

    return NextResponse.json({
      success: true,
      siteKey,
      site,
      snippet,
      verifyUrl: `${appUrl}/api/monitor?key=${siteKey}`,
      dashboardUrl: `${appUrl}/sites/${siteKey}`,
    })
  } catch (err: any) {
    console.error('Connect error:', err)
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 })
  }
}

function buildSnippet(siteKey: string, appUrl: string): string {
  return `<!-- WebScan Pro Security Monitor -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${appUrl}/monitor.js';
    s.setAttribute('data-site-key', '${siteKey}');
    s.async = true;
    document.head.appendChild(s);
  })();
</script>
<!-- End WebScan Pro -->`
}
