'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, RefreshCw, Mail, CheckCircle2, XCircle, AlertTriangle,
  Info, Lock, Zap, Globe, Server, ChevronDown, ExternalLink
} from 'lucide-react'
import { ScanResult, ScanFinding, ScanCategory, Severity } from '@/lib/types'

const CATEGORY_LABELS: Record<ScanCategory, string> = {
  security: 'Security',
  ssl: 'SSL / HTTPS',
  links: 'Broken Links',
  performance: 'Performance',
  cve: 'CVE',
  owasp: 'OWASP',
  headers: 'HTTP Headers',
}

const CATEGORY_ICONS: Record<ScanCategory, any> = {
  security: Shield,
  ssl: Lock,
  links: Globe,
  performance: Zap,
  cve: Server,
  owasp: AlertTriangle,
  headers: Server,
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'pass']

interface ScanResultsProps {
  result: ScanResult
  onReset: () => void
}

export default function ScanResults({ result, onReset }: ScanResultsProps) {
  const [activeCategory, setActiveCategory] = useState<ScanCategory | 'all'>('all')
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)

  const scoreColor = result.score >= 80 ? '#00FF88' : result.score >= 50 ? '#FFB800' : '#FF3B5C'
  const scoreLabel = result.score >= 80 ? 'Good' : result.score >= 50 ? 'Fair' : 'Poor'

  const categories = Array.from(new Set(result.findings.map(f => f.category))) as ScanCategory[]

  const filteredFindings = result.findings
    .filter(f => activeCategory === 'all' || f.category === activeCategory)
    .sort((a, b) => {
      if (a.passed !== b.passed) return a.passed ? 1 : -1
      return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    })

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-bg/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Shield size={14} className="text-accent" />
          </div>
          <span className="font-display font-semibold text-sm">WebScan<span className="text-accent">Pro</span></span>
          <span className="hidden sm:inline text-text-secondary text-xs font-mono">/ {result.url}</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border hover:border-accent/30 text-text-secondary hover:text-accent text-xs font-mono transition-all"
        >
          <RefreshCw size={12} />
          New Scan
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8"
        >
          {/* Score */}
          <div className="card p-6 flex items-center gap-6">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full score-ring" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#1C2333" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - result.score / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-xl" style={{ color: scoreColor }}>
                  {result.score}
                </span>
              </div>
            </div>
            <div>
              <p className="text-text-secondary text-xs font-mono mb-1">Security Score</p>
              <p className="font-display font-bold text-2xl" style={{ color: scoreColor }}>{scoreLabel}</p>
              <p className="text-text-secondary text-xs mt-1 font-mono">
                {(result.durationMs / 1000).toFixed(1)}s scan time
              </p>
            </div>
          </div>

          {/* Summary counts */}
          <div className="card p-6 lg:col-span-2">
            <p className="text-text-secondary text-xs font-mono mb-4">Finding Summary</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { key: 'critical', label: 'Critical', color: '#FF3B5C', count: result.summary.critical },
                { key: 'high', label: 'High', color: '#FF6400', count: result.summary.high },
                { key: 'medium', label: 'Medium', color: '#FFB800', count: result.summary.medium },
                { key: 'low', label: 'Low', color: '#00FF88', count: result.summary.low },
                { key: 'info', label: 'Info', color: '#3B82F6', count: result.summary.info },
                { key: 'passed', label: 'Passed', color: '#4A5568', count: result.summary.passed },
              ].map(({ key, label, color, count }) => (
                <div key={key} className="text-center">
                  <div className="font-display font-bold text-xl" style={{ color }}>{count}</div>
                  <div className="text-xs font-mono mt-0.5" style={{ color, opacity: 0.7 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* SSL & Performance quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {result.ssl && (
            <>
              <StatCard
                label="SSL Status"
                value={result.ssl.valid ? 'Valid' : 'Invalid'}
                status={result.ssl.valid ? 'good' : 'bad'}
              />
              {result.ssl.daysRemaining !== undefined && (
                <StatCard
                  label="Cert Expires"
                  value={`${result.ssl.daysRemaining}d`}
                  status={result.ssl.daysRemaining > 30 ? 'good' : result.ssl.daysRemaining > 7 ? 'warn' : 'bad'}
                />
              )}
            </>
          )}
          {result.performance && (
            <>
              <StatCard
                label="Response Time"
                value={`${result.performance.responseTimeMs}ms`}
                status={result.performance.responseTimeMs < 1000 ? 'good' : result.performance.responseTimeMs < 3000 ? 'warn' : 'bad'}
              />
              <StatCard
                label="Compression"
                value={result.performance.compressionEnabled ? 'Enabled' : 'Disabled'}
                status={result.performance.compressionEnabled ? 'good' : 'warn'}
              />
            </>
          )}
        </motion.div>

        {/* Email notification status */}
        {result.emailSent && result.emailSentTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg border border-accent/20 bg-accent/5"
          >
            <Mail size={14} className="text-accent" />
            <span className="text-sm font-mono text-text-secondary">
              Security report emailed to <span className="text-accent">{result.emailSentTo}</span>
              {' '}({result.ownerContact.source})
            </span>
          </motion.div>
        )}

        {!result.emailSent && result.ownerContact.source === 'unknown' && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg border border-warn/20 bg-warn/5">
            <AlertTriangle size={14} className="text-warn" />
            <span className="text-sm font-mono text-text-secondary">
              Could not find owner email. Consider contacting them manually.
            </span>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterBtn
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label={`All (${result.findings.length})`}
          />
          {categories.map(cat => {
            const count = result.findings.filter(f => f.category === cat).length
            return (
              <FilterBtn
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                label={`${CATEGORY_LABELS[cat]} (${count})`}
              />
            )
          })}
        </div>

        {/* Findings list */}
        <div className="space-y-2">
          {filteredFindings.map((finding, i) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              index={i}
              expanded={expandedFinding === finding.id}
              onToggle={() => setExpandedFinding(expandedFinding === finding.id ? null : finding.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, status }: { label: string; value: string; status: 'good' | 'warn' | 'bad' }) {
  const colors = { good: '#00FF88', warn: '#FFB800', bad: '#FF3B5C' }
  return (
    <div className="card p-4">
      <p className="text-text-secondary text-xs font-mono mb-1">{label}</p>
      <p className="font-display font-bold text-lg" style={{ color: colors[status] }}>{value}</p>
    </div>
  )
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
        active
          ? 'bg-accent/10 border border-accent/30 text-accent'
          : 'border border-border text-text-secondary hover:border-accent/20 hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

function FindingCard({
  finding, index, expanded, onToggle
}: {
  finding: ScanFinding
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const severityClasses: Record<string, string> = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
    pass: 'badge-pass',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`card card-hover ${finding.passed ? 'opacity-60' : ''}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="flex-shrink-0">
          {finding.passed ? (
            <CheckCircle2 size={16} className="text-accent" />
          ) : finding.severity === 'critical' || finding.severity === 'high' ? (
            <XCircle size={16} className="text-danger" />
          ) : finding.severity === 'medium' ? (
            <AlertTriangle size={16} className="text-warn" />
          ) : (
            <Info size={16} className="text-info" />
          )}
        </div>

        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold flex-shrink-0 ${severityClasses[finding.severity] || ''}`}>
          {finding.severity.toUpperCase()}
        </span>

        <span className="flex-1 text-sm font-display font-medium">{finding.title}</span>

        <span className="text-muted text-xs font-mono hidden sm:block">{CATEGORY_LABELS[finding.category]}</span>

        <ChevronDown
          size={14}
          className={`text-muted flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 pt-0 space-y-3 border-t border-border"
        >
          <div className="pt-3">
            <p className="text-text-secondary text-xs font-mono mb-1">Description</p>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{finding.description}</p>
          </div>

          {!finding.passed && finding.recommendation && (
            <div className="bg-accent/5 border border-accent/15 rounded-lg p-3">
              <p className="text-accent text-xs font-mono mb-1">Recommendation</p>
              <p className="text-sm text-text-primary leading-relaxed">{finding.recommendation}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {finding.owasp && (
              <span className="badge-info px-2 py-0.5 rounded text-xs font-mono">{finding.owasp}</span>
            )}
            {finding.cve && (
              <a
                href={`https://nvd.nist.gov/vuln/detail/${finding.cve}`}
                target="_blank"
                rel="noopener noreferrer"
                className="badge-critical px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1"
              >
                {finding.cve} <ExternalLink size={10} />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
