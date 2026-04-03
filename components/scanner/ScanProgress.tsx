'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, Loader2 } from 'lucide-react'
import { ScanResult } from '@/lib/types'

const SCAN_STEPS = [
  { label: 'Resolving DNS & Connecting', duration: 800 },
  { label: 'Checking SSL Certificate', duration: 1200 },
  { label: 'Fetching HTTP Headers', duration: 600 },
  { label: 'Analyzing Security Headers', duration: 900 },
  { label: 'Scanning for XSS Vectors', duration: 1100 },
  { label: 'Testing CSRF Protection', duration: 700 },
  { label: 'Crawling & Checking Links', duration: 2000 },
  { label: 'Measuring Performance', duration: 800 },
  { label: 'Querying CVE Database', duration: 1000 },
  { label: 'Running OWASP Top 10 Checks', duration: 1200 },
  { label: 'Discovering Owner Contact', duration: 900 },
  { label: 'Generating Report', duration: 600 },
  { label: 'Sending Notification', duration: 500 },
]

interface ScanProgressProps {
  url: string
  onComplete: (result: ScanResult) => void
}

export default function ScanProgress({ url, onComplete }: ScanProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [percentage, setPercentage] = useState(0)
  const logsRef = useRef<HTMLDivElement>(null)
  const hasScanned = useRef(false)

  useEffect(() => {
    if (hasScanned.current) return
    hasScanned.current = true

    // Animate through steps while actual scan runs
    let stepIndex = 0
    const advanceStep = () => {
      if (stepIndex >= SCAN_STEPS.length) return
      setCurrentStep(stepIndex)
      setLogs(prev => [...prev, `> ${SCAN_STEPS[stepIndex].label}...`])
      setPercentage(Math.round((stepIndex / SCAN_STEPS.length) * 90))

      const delay = SCAN_STEPS[stepIndex].duration
      stepIndex++

      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIndex - 1])
        if (stepIndex < SCAN_STEPS.length) {
          advanceStep()
        }
      }, delay)
    }

    advanceStep()

    // Actual API call
    const runScan = async () => {
      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, sendEmail: true }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        // Wait for animation to catch up if scan finished early
        setTimeout(() => {
          setPercentage(100)
          setLogs(prev => [...prev, '> Scan complete! ✓'])
          onComplete(data)
        }, 1000)
      } catch (err: any) {
        setLogs(prev => [...prev, `> Error: ${err.message}`])
      }
    }

    runScan()
  }, [url, onComplete])

  // Auto scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center py-12">
      {/* Target */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center animate-glow">
          <Shield size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-text-secondary text-xs font-mono">Scanning target</p>
          <p className="font-display font-semibold text-sm">{url}</p>
        </div>
      </div>

      {/* Progress ring */}
      <div className="relative w-32 h-32 mb-8">
        <svg className="w-full h-full score-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#1C2333" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="#00FF88"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold text-2xl text-accent">{percentage}%</span>
        </div>
      </div>

      {/* Steps list */}
      <div className="w-full max-w-md space-y-2 mb-8">
        {SCAN_STEPS.map((step, i) => {
          const isDone = completedSteps.includes(i)
          const isActive = currentStep === i && !isDone
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
              transition={{ delay: 0 }}
              className={`flex items-center gap-3 text-sm font-mono transition-colors ${
                isDone ? 'text-text-secondary' : isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
              ) : isActive ? (
                <Loader2 size={14} className="animate-spin flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-current flex-shrink-0" />
              )}
              {step.label}
            </motion.div>
          )
        })}
      </div>

      {/* Terminal log */}
      <div
        ref={logsRef}
        className="w-full max-w-md card p-4 h-32 overflow-y-auto"
      >
        {logs.map((log, i) => (
          <p key={i} className="text-xs font-mono text-text-secondary leading-relaxed">
            {log}
          </p>
        ))}
        <span className="text-xs font-mono text-accent animate-terminal-blink">█</span>
      </div>
    </div>
  )
}
