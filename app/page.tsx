'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Globe, Lock, AlertTriangle, ChevronRight, Wifi } from 'lucide-react'
import Link from 'next/link'
import ScannerForm from '@/components/scanner/ScannerForm'
import ScanProgress from '@/components/scanner/ScanProgress'
import ScanResults from '@/components/scanner/ScanResults'
import { ScanResult } from '@/lib/types'

type PageState = 'landing' | 'scanning' | 'results'

export default function HomePage() {
  const [pageState, setPageState] = useState<PageState>('landing')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanningUrl, setScanningUrl] = useState('')

  const handleScanStart = (url: string) => { setScanningUrl(url); setPageState('scanning') }
  const handleScanComplete = (result: ScanResult) => { setScanResult(result); setPageState('results') }
  const handleReset = () => { setScanResult(null); setScanningUrl(''); setPageState('landing') }

  return (
    <main className="min-h-screen bg-bg scan-grid">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield size={14} className="text-accent" />
          </div>
          <span className="font-display font-semibold text-sm">WebScan<span className="text-accent">Pro</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <a href="#features" className="hidden md:block hover:text-text-primary transition-colors">Features</a>
          <Link href="/connect" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded border border-accent/30 bg-accent/5 text-accent text-xs font-mono hover:bg-accent/10 transition-all">
            <Wifi size={12} />Connect Site
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-accent/30 hover:text-accent transition-all text-xs font-mono">
            Dashboard
          </Link>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {pageState === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
            <section className="pt-32 pb-16 px-6 max-w-5xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  OWASP Top 10 · SSL · CVE · Performance · Broken Links
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-center font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight mb-6">
                Scan. Detect.<br /><span className="text-accent">Protect.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-center text-text-secondary text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                Run a one-off scan — or connect your site for <span className="text-accent font-semibold">24/7 automated monitoring</span> with instant email alerts when issues are found.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <ScannerForm onScanStart={handleScanStart} onScanComplete={handleScanComplete} />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="flex items-center gap-4 max-w-2xl mx-auto mt-6 mb-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted text-xs font-mono">or monitor 24/7</span>
                <div className="flex-1 h-px bg-border" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Link href="/connect" className="group block max-w-2xl mx-auto card p-5 border-accent/20 bg-accent/5 hover:bg-accent/8 hover:border-accent/40 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                        <Wifi size={18} className="text-accent" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-accent">Connect your website for 24/7 monitoring</p>
                        <p className="text-text-secondary text-xs font-mono mt-0.5">One script tag → auto-scan every 6h → instant alerts on new security issues</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-accent flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-wrap justify-center gap-8 mt-14 text-center">
                {[{ value: '12+', label: 'Scan Types' }, { value: 'OWASP', label: 'Top 10 Covered' }, { value: '< 60s', label: 'Full Scan Time' }, { value: '6h', label: 'Monitor Interval' }].map(stat => (
                  <div key={stat.label}>
                    <div className="font-display font-bold text-2xl text-accent">{stat.value}</div>
                    <div className="text-text-secondary text-xs mt-1 font-mono">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </section>

            {/* How monitoring works */}
            <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-mono mb-4">
                  <Wifi size={11} />Continuous Monitoring
                </div>
                <h2 className="font-display font-bold text-3xl mb-3">Connect Once. Protected Forever.</h2>
                <p className="text-text-secondary max-w-xl mx-auto">One script tag on your site. We watch it 24/7 and email you the moment a security issue appears.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { n: 1, title: 'Register & Get Your Key', desc: 'Enter your site URL and email. We generate a unique site key and send you the install snippet.' },
                  { n: 2, title: 'Paste One Script Tag', desc: "Add the snippet before </head>. Works with WordPress, Shopify, Webflow, Next.js, or plain HTML." },
                  { n: 3, title: 'Get Alerted Automatically', desc: 'We scan every 6 hours. New bugs or vulnerabilities → instant detailed email with fix instructions.' },
                ].map((step) => (
                  <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: step.n * 0.1 }} className="card p-6 text-center">
                    <div className="w-10 h-10 rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center mx-auto mb-4">
                      <span className="font-mono text-accent text-sm font-bold">{step.n}</span>
                    </div>
                    <h3 className="font-display font-semibold mb-2">{step.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div className="max-w-2xl mx-auto card p-5 mb-8 bg-bg/60">
                <p className="text-muted text-xs font-mono mb-3">Your embed snippet:</p>
                <pre className="text-xs font-mono text-text-secondary leading-relaxed overflow-x-auto">{`<!-- WebScan Pro Security Monitor -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://webscanpro.com/monitor.js';
    s.setAttribute('data-site-key', `}<span className="text-accent">'wsp_your_unique_key'</span>{`);
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`}</pre>
              </div>
              <div className="text-center">
                <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg font-display font-bold rounded-lg hover:bg-accent-dim transition-colors">
                  <Wifi size={16} />Connect My Website — Free
                </Link>
              </div>
            </section>

            {/* Features grid */}
            <section id="features" className="py-20 px-6 max-w-5xl mx-auto border-t border-border/40">
              <div className="text-center mb-12">
                <h2 className="font-display font-bold text-3xl mb-3">What We Scan</h2>
                <p className="text-text-secondary">6 critical scan categories on every check</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card card-hover p-5">
                    <div className={`w-9 h-9 rounded-lg ${f.iconBg} flex items-center justify-center mb-4`}>
                      <f.icon size={16} className={f.iconColor} />
                    </div>
                    <h3 className="font-display font-semibold text-sm mb-2">{f.title}</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">{f.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {f.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-xs font-mono bg-border/50 text-text-secondary">{tag}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            <footer className="border-t border-border py-8 px-6 text-center text-text-secondary text-xs font-mono">
              <p>WebScan Pro — Ethical security scanning. Only scan sites you own or have permission to test.</p>
              <div className="flex justify-center gap-6 mt-3">
                <Link href="/connect" className="hover:text-accent transition-colors">Connect Site</Link>
                <Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link>
              </div>
            </footer>
          </motion.div>
        )}

        {pageState === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24 px-6 max-w-3xl mx-auto">
            <ScanProgress url={scanningUrl} onComplete={handleScanComplete} />
          </motion.div>
        )}

        {pageState === 'results' && scanResult && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-20">
            <ScanResults result={scanResult} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

const features = [
  { title: 'Security Vulnerabilities', description: 'Detect XSS, SQL Injection, CSRF vulnerabilities, insecure form submissions, and missing security headers.', icon: Shield, iconBg: 'bg-danger/10', iconColor: 'text-danger', tags: ['XSS', 'SQLi', 'CSRF', 'Headers'] },
  { title: 'SSL / HTTPS', description: 'Validate SSL certificate validity, expiry date, cipher strength, HSTS enforcement, and mixed content.', icon: Lock, iconBg: 'bg-accent/10', iconColor: 'text-accent', tags: ['TLS', 'Cert Expiry', 'HSTS', 'Mixed Content'] },
  { title: 'Broken Links', description: 'Crawl internal and external links, detect 404s, redirects, and orphaned pages across the site.', icon: Globe, iconBg: 'bg-info/10', iconColor: 'text-info', tags: ['404 Detection', 'Redirects', 'Crawling'] },
  { title: 'Performance', description: 'Analyze response times, uncompressed assets, render-blocking resources, and Core Web Vitals hints.', icon: Zap, iconBg: 'bg-warn/10', iconColor: 'text-warn', tags: ['Response Time', 'Compression', 'Assets'] },
  { title: 'CVE / Dependencies', description: 'Detect exposed version headers and map them to known CVE vulnerabilities in the NVD database.', icon: AlertTriangle, iconBg: 'bg-danger/10', iconColor: 'text-danger', tags: ['CVE', 'NVD', 'Server Headers'] },
  { title: 'OWASP Top 10', description: 'Systematically check all OWASP Top 10 2021 categories including broken access control and misconfigurations.', icon: Shield, iconBg: 'bg-accent/10', iconColor: 'text-accent', tags: ['OWASP 2021', 'A01–A10', 'Full Coverage'] },
]
