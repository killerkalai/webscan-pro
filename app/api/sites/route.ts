import { NextRequest, NextResponse } from 'next/server'
import { getSiteByKey, getSiteScansHistory } from '@/lib/db/supabase'

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const site = await getSiteByKey(key)
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const history = await getSiteScansHistory(site.id, 30)

  return NextResponse.json({ site, history })
}
