'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Mail, ChevronDown, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ScanResult } from '@/lib/types'

interface ScannerFormProps {
  onScanStart: (url: string) => void
  onScanComplete: (result: ScanResult) => void
}

export default function ScannerForm({ onScanStart, onScanComplete }: ScannerFormProps) {
  const [url, setUrl] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL to scan')
      return
    }

    setLoading(true)
    onScanStart(trimmed)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, ownerEmail: ownerEmail.trim() || undefined, sendEmail: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed')
      }

      onScanComplete(data)
    } catch (err: any) {
      setError(err.message || 'Scan failed. Please try again.')
      toast.error(err.message || 'Scan failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleScan} className="w-full max-w-2xl mx-auto">
      {/* Main input */}
      <div className="relative flex items-center gap-0 animate-glow">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full pl-10 pr-4 py-4 bg-surface border border-border border-r-0 rounded-l-lg font-mono text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            disabled={loading}
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center gap-2 px-6 py-4 bg-accent text-bg font-display font-bold text-sm rounded-r-lg hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            'Scan Now'
          )}
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 text-danger text-sm font-mono"
        >
          <AlertCircle size={14} />
          {error}
        </motion.div>
      )}

      {/* Advanced options toggle */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-text-secondary text-xs font-mono hover:text-text-primary transition-colors"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Advanced options
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                <Mail size={14} />
              </div>
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com (optional — we'll find it automatically)"
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg font-mono text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <p className="text-muted text-xs mt-2 font-mono">
              If not provided, we&apos;ll auto-detect via WHOIS & contact page
            </p>
          </motion.div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-center text-muted text-xs font-mono mt-4">
        Only scan websites you own or have explicit permission to test
      </p>
    </form>
  )
}
