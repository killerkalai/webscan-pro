import { NextRequest, NextResponse } from 'next/server'
import { getActiveSitesForMonitoring } from '@/lib/db/supabase'

export const runtime = 'nodejs'
export const maxDuration = 300

// This route is called by Vercel Cron every 6 hours
// Add to vercel.json: "crons": [{ "path": "/api/cron/scan-sites", "schedule": "0 */6 * * *" }]
export async function GET(req: NextRequest) {
  // Security: verify cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sites = await getActiveSitesForMonitoring()
    console.log(`[Cron] Starting scan for ${sites.length} active connected sites`)

    const results = []

    // Scan sites sequentially to avoid overloading
    for (const site of sites) {
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/monitor`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: site.site_key }),
          }
        )
        const data = await resp.json()
        results.push({ url: site.url, ...data })
        console.log(`[Cron] Scanned ${site.url}: score=${data.score}`)
      } catch (err: any) {
        results.push({ url: site.url, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: results.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
