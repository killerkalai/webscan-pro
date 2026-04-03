'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, ArrowLeft, RefreshCw, Mail, CheckCircle2, AlertTriangle,
  XCircle, TrendingUp, TrendingDown, Minus, Clock, Copy, ExternalLink, Wifi
} from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function SiteDashboardPage({ params }: { params: { key: string } }) {
  const [data, setData] = useState<{ site: any; history: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/sites?key=${params.key}`)
      if (!res.ok) throw new Error('Site not found')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [params.key])

  const triggerScan = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: params.key }),
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`Scan complete! Score: ${result.score}/100`)
        fetchData()
      } else {
        toast.error(result.error || 'Scan failed')
      }
    } catch {
      toast.error('Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const copySnippet = () => {
    const appUrl = window.location.origin
    const snippet = `<!-- WebScan Pro Security Monitor -->\n<script>\n  (function() {\n    var s = document.createElement('script');\n    s.src = '${appUrl}/monitor.js';\n    s.setAttribute('data-site-key', '${params.key}');\n    s.async = true;\n    document.head.appendChild(s);\n  })();\n</script>`
    navigator.clipboard.writeText(snippet)
    toast.success('Snippet copied!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm font-mono">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center card p-10">
          <Shield size={32} className="text-muted mx-auto mb-4" />
          <p className="font-display font-semibold mb-2">Site not found</p>
          <p className="text-text-secondary text-sm mb-4">Check your site key and try again.</p>
          <Link href="/connect" className="text-accent text-sm font-mono hover:underline">Connect a new site</Link>
        </div>
      </div>
    )
  }

  const { site, history } = data
  const score = site.last_score ?? null
  const scoreColor = score == null ? '#4A5568' : score >= 80 ? '#00FF88' : score >= 50 ? '#FFB800' : '#FF3B5C'
  const scoreLabel = score == null ? 'Pending' : score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'

  const chartData = [...history].reverse().map((h: any) => ({
    date: new Date(h.scanned_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: h.score,
  }))

  const latestScan = history[0]
  const prevScan = history[1]
  const delta = latestScan && prevScan ? latestScan.score - prevScan.score : null

  return (
    <main className="min-h-screen bg-bg scan-grid">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield size={14} className="text-accent" />
          </div>
          <span className="font-display font-semibold text-sm">WebScan<span className="text-accent">Pro</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-accent/30 text-text-secondary hover:text-accent text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Scan Now'}
          </button>
          <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors">
            <ArrowLeft size={14} />
            Back
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        {/* Site header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${
                site.status === 'active' ? 'bg-accent animate-pulse' :
                site.status === 'error' ? 'bg-danger' : 'bg-warn'
              }`} />
              <span className="text-xs font-mono text-text-secondary capitalize">{site.status}</span>
              {site.script_verified && (
                <span className="flex items-center gap-1 text-xs font-mono text-accent">
                  <Wifi size={10} />
                  Script verified
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">{site.url}</h1>
            <p className="text-text-secondary text-sm font-mono mt-1">
              {site.last_scan_at
                ? `Last scanned ${new Date(site.last_scan_at).toLocaleString()}`
                : 'No scans yet — first scan pending'}
            </p>
          </div>
          {!site.script_verified && (
            <button
              onClick={copySnippet}
              className="flex items-center gap-2 px-4 py-2 border border-warn/30 bg-warn/5 text-warn rounded-lg text-sm font-mono hover:bg-warn/10 transition-colors"
            >
              <Copy size={13} />
              Copy Install Snippet
            </button>
          )}
        </div>

        {/* Score + stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="card p-5 col-span-2 sm:col-span-1 flex items-center gap-4">
            <div>
              <p className="text-text-secondary text-xs font-mono mb-1">Security Score</p>
              <div className="font-display font-bold text-3xl" style={{ color: scoreColor }}>{score ?? '—'}</div>
              <p className="text-xs font-mono mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</p>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-text-secondary text-xs font-mono mb-1">Score Change</p>
            {delta != null ? (
              <div className={`flex items-center gap-1 font-display font-bold text-xl ${delta > 0 ? 'text-accent' : delta < 0 ? 'text-danger' : 'text-muted'}`}>
                {delta > 0 ? <TrendingUp size={16} /> : delta < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                {delta > 0 ? '+' : ''}{delta}
              </div>
            ) : <div className="text-muted font-mono text-sm">—</div>}
            <p className="text-xs font-mono text-muted mt-0.5">vs last scan</p>
          </div>

          <div className="card p-5">
            <p className="text-text-secondary text-xs font-mono mb-1">Total Scans</p>
            <div className="font-display font-bold text-xl text-text-primary">{history.length}</div>
            <p className="text-xs font-mono text-muted mt-0.5">since connected</p>
          </div>

          <div className="card p-5">
            <p className="text-text-secondary text-xs font-mono mb-1">Alerts Sent</p>
            <div className="font-display font-bold text-xl text-text-primary">
              {history.filter((h: any) => h.email_sent).length}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Mail size={10} className="text-muted" />
              <p className="text-xs font-mono text-muted">{site.owner_email}</p>
            </div>
          </div>
        </div>

        {/* Score trend chart */}
        {chartData.length > 1 && (
          <div className="card p-6 mb-6">
            <p className="text-text-secondary text-xs font-mono mb-4">Score History</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: '#0D1117', border: '1px solid #1C2333', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}
                  labelStyle={{ color: '#8892A4' }}
                  itemStyle={{ color: '#00FF88' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#00FF88"
                  strokeWidth={2}
                  dot={{ fill: '#00FF88', r: 3 }}
                  activeDot={{ r: 5, fill: '#00FF88' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Scan history */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-xs font-mono text-text-secondary uppercase tracking-wide">Scan History</p>
            <p className="text-xs font-mono text-muted">Re-scans every 6 hours</p>
          </div>
          {history.length === 0 ? (
            <div className="p-10 text-center text-muted text-sm font-mono">
              No scans yet. First scan will run automatically.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((h: any, i: number) => {
                const sc = h.score ?? 0
                const sColor = sc >= 80 ? '#00FF88' : sc >= 50 ? '#FFB800' : '#FF3B5C'
                const d = h.score_delta
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-5 py-3"
                  >
                    <div className="w-10 h-10 rounded-lg border flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                      style={{ color: sColor, borderColor: `${sColor}30`, background: `${sColor}10` }}>
                      {sc}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Clock size={11} className="text-muted" />
                        <span className="text-xs font-mono text-text-secondary">
                          {new Date(h.scanned_at).toLocaleString()}
                        </span>
                        {i === 0 && <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-accent/10 text-accent">latest</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {d != null && (
                          <span className={`text-xs font-mono ${d > 0 ? 'text-accent' : d < 0 ? 'text-danger' : 'text-muted'}`}>
                            {d > 0 ? '▲' : d < 0 ? '▼' : '—'} {Math.abs(d)} pts
                          </span>
                        )}
                        {h.summary && (
                          <>
                            {h.summary.critical > 0 && <span className="text-xs font-mono text-danger">{h.summary.critical} critical</span>}
                            {h.summary.high > 0 && <span className="text-xs font-mono text-orange-500">{h.summary.high} high</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {h.email_sent && <Mail size={13} className="text-accent" title="Alert sent" />}
                      {h.alert_triggered && <AlertTriangle size={13} className="text-warn" title="Alert triggered" />}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Script install status */}
        {!site.script_verified && (
          <div className="card p-5 mt-4 border-warn/20 bg-warn/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-warn flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-semibold text-sm mb-1">Script not yet detected</p>
                <p className="text-text-secondary text-xs font-mono mb-3">
                  Add the monitor script to your site to activate real-time monitoring. 
                  Monitoring starts automatically once the script is live.
                </p>
                <button onClick={copySnippet} className="flex items-center gap-1.5 text-xs font-mono text-warn hover:text-warn/80 transition-colors">
                  <Copy size={11} />
                  Copy install snippet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
