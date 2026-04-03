'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowLeft, CheckCircle2, Copy, ExternalLink, Mail, Globe, Bell } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

type Step = 'form' | 'snippet' | 'verify'

interface ConnectResult {
  siteKey: string
  snippet: string
  dashboardUrl: string
}

export default function ConnectPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConnectResult | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  const [form, setForm] = useState({
    url: '',
    ownerEmail: '',
    ownerName: '',
    alertFrequency: 'realtime',
  })

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url || !form.ownerEmail) {
      toast.error('URL and email are required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      setResult(data)
      setStep('snippet')
      toast.success('Site registered! Check your email for setup instructions.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!result) return
    setVerifying(true)
    try {
      // Poll the site status API to check if script was detected
      await new Promise(r => setTimeout(r, 2000)) // Wait for ping to arrive
      const res = await fetch(`/api/sites?key=${result.siteKey}`)
      const data = await res.json()
      if (data.site?.script_verified) {
        setVerified(true)
        setStep('verify')
        toast.success('Script detected! Monitoring is active.')
      } else {
        toast.error("Script not detected yet. Make sure you've saved and deployed your changes.")
      }
    } catch {
      toast.error('Verification check failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const copySnippet = () => {
    if (result?.snippet) {
      navigator.clipboard.writeText(result.snippet)
      toast.success('Snippet copied to clipboard!')
    }
  }

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
        <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors">
          <ArrowLeft size={14} />
          Back
        </Link>
      </nav>

      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            24/7 Security Monitoring
          </div>
          <h1 className="font-display font-bold text-4xl mb-3">
            Connect Your Website
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Add one script tag. We monitor 24/7 and email you the moment a security issue is detected.
          </p>
        </motion.div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { key: 'form', label: 'Register' },
            { key: 'snippet', label: 'Install' },
            { key: 'verify', label: 'Verified' },
          ].map((s, i) => {
            const done = step === 'snippet' && i === 0
              || step === 'verify' && i <= 1
              || verified && i <= 2
            const active = s.key === step
            return (
              <div key={s.key} className="flex items-center gap-3">
                {i > 0 && <div className={`w-8 h-px ${done ? 'bg-accent' : 'bg-border'}`} />}
                <div className={`flex items-center gap-2 text-xs font-mono ${active ? 'text-accent' : done ? 'text-accent/60' : 'text-muted'}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-accent bg-accent/10' : done ? 'border-accent/40' : 'border-border'}`}>
                    {done ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>}
                  </div>
                  {s.label}
                </div>
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Registration Form ── */}
          {step === 'form' && (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleConnect}
              className="card p-8 space-y-5"
            >
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-2">
                  <Globe size={11} className="inline mr-1" />
                  Website URL *
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-2">
                  <Mail size={11} className="inline mr-1" />
                  Your Email (for alerts) *
                </label>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={e => setForm(f => ({ ...f, ownerEmail: e.target.value }))}
                  placeholder="you@yourwebsite.com"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-secondary mb-2">
                  <Bell size={11} className="inline mr-1" />
                  Alert Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'realtime', label: 'Real-time', desc: 'On new issues' },
                    { value: 'daily', label: 'Daily', desc: 'Once per day' },
                    { value: 'weekly', label: 'Weekly', desc: 'Weekly digest' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, alertFrequency: opt.value }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        form.alertFrequency === opt.value
                          ? 'border-accent/40 bg-accent/5 text-accent'
                          : 'border-border text-text-secondary hover:border-accent/20'
                      }`}
                    >
                      <div className="text-xs font-display font-semibold">{opt.label}</div>
                      <div className="text-xs font-mono opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-accent text-bg font-display font-bold rounded-lg hover:bg-accent-dim disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : 'Connect My Website →'}
              </motion.button>

              <p className="text-center text-muted text-xs font-mono">
                Free · No credit card · Unsubscribe anytime
              </p>
            </motion.form>
          )}

          {/* ── Step 2: Install Snippet ── */}
          {step === 'snippet' && result && (
            <motion.div
              key="snippet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display font-semibold text-lg">Install the Monitor Script</h2>
                    <p className="text-text-secondary text-sm mt-1">Paste this before the closing <code className="text-accent font-mono text-xs">&lt;/head&gt;</code> tag</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <span className="font-mono font-bold text-accent text-xs">2</span>
                  </div>
                </div>

                <div className="relative">
                  <pre className="bg-bg border border-border rounded-lg p-4 text-xs font-mono text-text-secondary overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {result.snippet}
                  </pre>
                  <button
                    onClick={copySnippet}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded text-xs font-mono text-text-secondary hover:text-accent hover:border-accent/30 transition-all"
                  >
                    <Copy size={11} />
                    Copy
                  </button>
                </div>
              </div>

              {/* Where to add it */}
              <div className="card p-5">
                <h3 className="font-display font-semibold text-sm mb-3">Where to add it</h3>
                <div className="space-y-2 text-sm text-text-secondary font-mono">
                  {[
                    ['WordPress', 'Appearance → Theme Editor → header.php before </head>'],
                    ['Shopify', 'Online Store → Themes → Edit Code → theme.liquid'],
                    ['Webflow', 'Project Settings → Custom Code → Head Code'],
                    ['HTML file', 'Directly before </head> in your HTML'],
                    ['Next.js', 'In app/layout.tsx inside <head> or use Script component'],
                  ].map(([platform, where]) => (
                    <div key={platform} className="flex gap-3">
                      <span className="text-accent flex-shrink-0 w-20">{platform}</span>
                      <span className="text-muted">{where}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleVerify}
                disabled={verifying}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-accent text-bg font-display font-bold rounded-lg hover:bg-accent-dim disabled:opacity-50 transition-colors card"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                    Checking for script...
                  </span>
                ) : "I've added the script — Verify Now →"}
              </motion.button>

              <p className="text-center text-muted text-xs font-mono">
                Already added it? Click verify. We'll confirm it's live on your site.
              </p>
            </motion.div>
          )}

          {/* ── Step 3: Verified ── */}
          {step === 'verify' && result && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="card p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 size={28} className="text-accent" />
                </motion.div>

                <h2 className="font-display font-bold text-2xl mb-2">You're protected!</h2>
                <p className="text-text-secondary mb-6">
                  WebScan Pro is now actively monitoring <strong className="text-accent">{form.url}</strong>.
                  The first full scan is running now — you'll get an email with the results shortly.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                  {[
                    { icon: '🔐', label: 'Security Scan', desc: 'Running now' },
                    { icon: '🔔', label: 'Alerts Active', desc: form.alertFrequency },
                    { icon: '⏱️', label: 'Re-scans', desc: 'Every 6 hours' },
                  ].map(item => (
                    <div key={item.label} className="bg-bg/50 rounded-lg p-3 border border-border">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-xs font-display font-semibold">{item.label}</div>
                      <div className="text-xs font-mono text-muted mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/sites/${result.siteKey}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-bg font-display font-bold rounded-lg hover:bg-accent-dim transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open Dashboard
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-text-secondary rounded-lg hover:border-accent/30 hover:text-text-primary transition-all font-mono text-sm"
                  >
                    Scan Another Site
                  </Link>
                </div>
              </div>

              <div className="card p-4 text-left">
                <p className="text-xs font-mono text-muted mb-1">Your Site Key (keep safe)</p>
                <code className="text-accent text-sm font-mono">{result.siteKey}</code>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
