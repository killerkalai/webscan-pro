import * as cheerio from 'cheerio'
import axios from 'axios'
import { OwnerContact } from '../types'

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export async function findOwnerContact(
  url: string,
  html: string,
  providedEmail?: string
): Promise<OwnerContact> {
  // 1. Use provided email first
  if (providedEmail && isValidEmail(providedEmail)) {
    return { email: providedEmail, source: 'provided' }
  }

  const baseUrl = new URL(url)

  // 2. Try to find email in contact page
  const contactEmail = await findEmailInContactPage(url, html, baseUrl)
  if (contactEmail) {
    return { email: contactEmail, source: 'contact-page' }
  }

  // 3. Try WHOIS lookup
  const whoisEmail = await getWhoisEmail(baseUrl.hostname)
  if (whoisEmail) {
    return { email: whoisEmail, source: 'whois' }
  }

  return { source: 'unknown' }
}

async function findEmailInContactPage(
  url: string,
  html: string,
  baseUrl: URL
): Promise<string | null> {
  // First check the main page HTML
  const mainPageEmail = extractEmailFromHtml(html)
  if (mainPageEmail) return mainPageEmail

  // Try contact page
  const contactPaths = ['/contact', '/contact-us', '/about', '/about-us', '/support', '/help']

  for (const path of contactPaths) {
    try {
      const contactUrl = new URL(path, baseUrl.origin).href
      const resp = await axios.get(contactUrl, {
        timeout: 8000,
        validateStatus: () => true,
        headers: { 'User-Agent': 'WebScanPro/1.0' },
      })
      if (resp.status < 400) {
        const email = extractEmailFromHtml(resp.data)
        if (email) return email
      }
    } catch { continue }
  }

  return null
}

function extractEmailFromHtml(html: string): string | null {
  const $ = cheerio.load(html)

  // Check mailto links first
  const mailtoLinks: string[] = []
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const email = href.replace('mailto:', '').split('?')[0].trim()
    if (isValidEmail(email) && !isGenericEmail(email)) {
      mailtoLinks.push(email)
    }
  })
  if (mailtoLinks.length > 0) return mailtoLinks[0]

  // Check page text
  const text = $('body').text()
  const matches = text.match(EMAIL_REGEX) || []
  const validEmails = matches.filter(e => isValidEmail(e) && !isGenericEmail(e))
  if (validEmails.length > 0) return validEmails[0]

  return null
}

async function getWhoisEmail(hostname: string): Promise<string | null> {
  try {
    // Use a free WHOIS API instead of the node-whois package for reliability
    const domain = hostname.replace(/^www\./, '')
    const resp = await axios.get(`https://api.whoisjson.com/v1/${domain}`, {
      timeout: 10000,
      validateStatus: () => true,
    })

    if (resp.data) {
      const whoisData = JSON.stringify(resp.data).toLowerCase()
      const matches = whoisData.match(EMAIL_REGEX) || []
      const validEmails = matches.filter((e: string) => isValidEmail(e))
      if (validEmails.length > 0) return validEmails[0]
    }
  } catch { /* WHOIS unavailable */ }

  return null
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isGenericEmail(email: string): boolean {
  const genericPrefixes = ['noreply', 'no-reply', 'donotreply', 'webmaster', 'postmaster', 'mailer-daemon']
  const prefix = email.split('@')[0].toLowerCase()
  return genericPrefixes.some(g => prefix.includes(g))
}
