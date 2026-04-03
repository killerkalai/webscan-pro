# 🛡️ WebScan Pro

> **Comprehensive website security & performance scanner with automated owner notifications.**

Paste any URL → get a full security audit → site owner gets emailed automatically.

![WebScan Pro](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Database-green) ![Resend](https://img.shields.io/badge/Resend-Email-orange)

---

## ✨ What It Scans

| Category | Checks |
|---|---|
| 🔐 **Security** | XSS vectors, CSRF tokens, SQLi-risk params, sensitive data exposure, eval() usage |
| 🔒 **SSL / HTTPS** | Certificate validity, expiry date, HSTS, mixed content |
| 📋 **HTTP Headers** | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| 🌐 **Broken Links** | Internal 404s, external dead links, redirect chains |
| ⚡ **Performance** | Response time, compression (gzip/br), server header leakage |
| 🛡️ **OWASP Top 10** | A01–A10 2021, directory listing, error exposure, auth issues |

## 📬 Owner Notification

After a scan, the system auto-detects the site owner's email via:

1. **Provided email** — if you typed one in Advanced Options
2. **WHOIS lookup** — queries domain registration data
3. **Contact page crawl** — checks `/contact`, `/about`, `mailto:` links

Then sends a professional HTML email report with all findings + fix recommendations.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourname/webscan-pro.git
cd webscan-pro
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase — https://supabase.com (free tier works)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Resend — https://resend.com (free: 3,000 emails/month)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

Go to your [Supabase SQL Editor](https://app.supabase.com) and run:

```sql
-- Copy contents of supabase/schema.sql and run it
```

### 4. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🗂️ Project Structure

```
webscan-pro/
├── app/
│   ├── page.tsx                  # Landing page + state router
│   ├── layout.tsx                # Root layout + fonts
│   ├── globals.css               # Cyberpunk theme
│   ├── dashboard/
│   │   └── page.tsx              # Recent scans dashboard
│   └── api/
│       └── scan/
│           └── route.ts          # Main scan orchestrator API
│
├── components/
│   └── scanner/
│       ├── ScannerForm.tsx       # URL input form
│       ├── ScanProgress.tsx      # Animated progress screen
│       └── ScanResults.tsx       # Full results dashboard
│
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── scanners/
│   │   ├── ssl.ts                # SSL certificate checker
│   │   ├── headers.ts            # HTTP headers + performance
│   │   ├── security.ts           # XSS / CSRF / OWASP / SQLi
│   │   ├── links.ts              # Broken link crawler
│   │   └── whois.ts              # Owner email detection
│   ├── email/
│   │   └── sendReport.ts         # Resend email with HTML report
│   └── db/
│       └── supabase.ts           # Supabase client + helpers
│
└── supabase/
    └── schema.sql                # Database schema
```

---

## 🌐 Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all env vars in Vercel dashboard → Settings → Environment Variables.

> **Note:** Set `maxDuration = 60` in `vercel.json` if scans timeout on free plan.

```json
{
  "functions": {
    "app/api/scan/route.ts": { "maxDuration": 60 }
  }
}
```

---

## 🔧 Configuration

| Env Var | Default | Description |
|---|---|---|
| `SCAN_TIMEOUT_MS` | `30000` | Max ms to wait for target server |
| `MAX_LINKS_TO_CHECK` | `30` | Max links to crawl per scan |
| `RESEND_API_KEY` | — | Resend API key for emails |
| `SUPABASE_URL` | — | Supabase project URL |

---

## ⚠️ Ethics & Legal

- **Only scan websites you own or have written permission to test**
- This tool performs passive analysis only — no active exploitation
- Results are informational; always verify with a certified security professional
- Complies with responsible disclosure principles

---

## 🛣️ Roadmap

- [ ] Scheduled recurring scans (cron)
- [ ] PDF report export
- [ ] Authenticated user accounts
- [ ] API key access for CI/CD integration
- [ ] Slack / Discord webhook notifications
- [ ] Historical score tracking & charts
- [ ] CVE database integration (NVD API)
- [ ] Browser-based JavaScript rendering (Puppeteer)

---

## 📄 License

MIT — free to use, fork, and deploy.
