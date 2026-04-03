import { getRecentScans } from '@/lib/db/supabase'
import Link from 'next/link'
import { Shield, ArrowLeft, Mail, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let scans: any[] = []
  try {
    scans = await getRecentScans(20)
  } catch {
    // Supabase not configured — show empty state
  }

  return (
    <main className="min-h-screen bg-bg scan-grid pt-20">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield size={14} className="text-accent" />
          </div>
          <span className="font-display font-semibold text-sm">WebScan<span className="text-accent">Pro</span></span>
        </div>
        <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors">
          <ArrowLeft size={14} />
          Back to Scanner
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-2">Recent Scans</h1>
          <p className="text-text-secondary font-mono text-sm">Last 20 security scans</p>
        </div>

        {scans.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield size={32} className="text-muted mx-auto mb-4" />
            <p className="font-display font-semibold mb-2">No scans yet</p>
            <p className="text-text-secondary text-sm font-mono mb-6">
              Run your first scan to see results here.
              {!process.env.SUPABASE_URL && ' (Connect Supabase to persist scans)'}
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-lg text-sm font-mono hover:bg-accent/20 transition-colors">
              Start Scanning
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan: any) => {
              const score = scan.score ?? 0
              const scoreColor = score >= 80 ? '#00FF88' : score >= 50 ? '#FFB800' : '#FF3B5C'
              const critical = scan.summary?.critical ?? 0
              const high = scan.summary?.high ?? 0

              return (
                <div key={scan.id} className="card card-hover p-4 flex items-center gap-4">
                  {/* Score */}
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-bold text-lg border"
                    style={{ color: scoreColor, borderColor: `${scoreColor}30`, background: `${scoreColor}10` }}>
                    {score}
                  </div>

                  {/* URL & meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{scan.url}</p>
                    <p className="text-text-secondary text-xs mt-0.5 font-mono">
                      {new Date(scan.scanned_at).toLocaleString()}
                      {critical > 0 && <span className="ml-2 text-danger">{critical} critical</span>}
                      {high > 0 && <span className="ml-2 text-orange-500">{high} high</span>}
                    </p>
                  </div>

                  {/* Email status */}
                  {scan.email_sent && (
                    <div className="flex items-center gap-1.5 text-accent text-xs font-mono flex-shrink-0">
                      <Mail size={12} />
                      <span className="hidden sm:inline">Notified</span>
                    </div>
                  )}

                  <ExternalLink size={14} className="text-muted flex-shrink-0" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
