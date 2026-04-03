import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'WebScan Pro — Security & Performance Scanner',
  description: 'Comprehensive website security vulnerability scanner. Detect XSS, SQLi, SSL issues, broken links, OWASP Top 10 threats — and auto-notify site owners.',
  keywords: 'website security scanner, vulnerability scanner, OWASP, SSL checker, XSS detection',
  openGraph: {
    title: 'WebScan Pro',
    description: 'Scan any website for security vulnerabilities, bugs, and performance issues.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="noise-overlay" />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0D1117',
              color: '#E2E8F0',
              border: '1px solid #1C2333',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#00FF88', secondary: '#0D1117' },
            },
            error: {
              iconTheme: { primary: '#FF3B5C', secondary: '#0D1117' },
            },
          }}
        />
      </body>
    </html>
  )
}
