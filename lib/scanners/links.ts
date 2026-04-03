import * as cheerio from 'cheerio'
import axios from 'axios'
import { LinkCheckResult, ScanFinding } from '../types'
import { v4 as uuidv4 } from 'uuid'

export async function checkLinks(
  url: string,
  html: string
): Promise<{ results: LinkCheckResult[]; findings: ScanFinding[] }> {
  const findings: ScanFinding[] = []
  const baseUrl = new URL(url)
  const $ = cheerio.load(html)

  // Collect all links
  const rawLinks = new Set<string>()
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    try {
      const resolved = new URL(href, url).href
      if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
        rawLinks.add(resolved)
      }
    } catch { /* ignore malformed */ }
  })

  // Limit to MAX_LINKS
  const maxLinks = parseInt(process.env.MAX_LINKS_TO_CHECK || '30')
  const links = Array.from(rawLinks).slice(0, maxLinks)

  // Check each link concurrently (batches of 5)
  const results: LinkCheckResult[] = []
  const batchSize = 5

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (linkUrl) => {
        try {
          const resp = await axios.head(linkUrl, {
            timeout: 8000,
            validateStatus: () => true,
            maxRedirects: 3,
            headers: { 'User-Agent': 'WebScanPro/1.0' },
          })
          return {
            url: linkUrl,
            status: resp.status,
            ok: resp.status < 400,
            redirect: resp.request?.res?.responseUrl !== linkUrl ? resp.request?.res?.responseUrl : undefined,
          } as LinkCheckResult
        } catch {
          return { url: linkUrl, status: 0, ok: false } as LinkCheckResult
        }
      })
    )
    results.push(...batchResults)
  }

  const broken = results.filter(r => !r.ok)
  const internal = results.filter(r => r.url.includes(baseUrl.hostname))
  const external = results.filter(r => !r.url.includes(baseUrl.hostname))

  if (broken.length === 0 && results.length > 0) {
    findings.push({
      id: uuidv4(),
      category: 'links',
      severity: 'pass',
      title: `All ${results.length} Links Working`,
      description: `Checked ${results.length} links (${internal.length} internal, ${external.length} external). No broken links found.`,
      recommendation: '',
      passed: true,
    })
  } else if (broken.length > 0) {
    const criticalBroken = broken.filter(r => r.url.includes(baseUrl.hostname)) // internal broken links
    const externalBroken = broken.filter(r => !r.url.includes(baseUrl.hostname))

    if (criticalBroken.length > 0) {
      findings.push({
        id: uuidv4(),
        category: 'links',
        severity: 'high',
        title: `${criticalBroken.length} Internal Broken Link(s)`,
        description: `Found ${criticalBroken.length} internal 404/error pages:\n${criticalBroken.slice(0, 5).map(r => `• ${r.url} (${r.status})`).join('\n')}`,
        recommendation: 'Fix or remove broken internal links. Set up 301 redirects for moved pages. Implement a custom 404 page.',
        passed: false,
      })
    }

    if (externalBroken.length > 0) {
      findings.push({
        id: uuidv4(),
        category: 'links',
        severity: 'medium',
        title: `${externalBroken.length} External Broken Link(s)`,
        description: `Found ${externalBroken.length} broken external links:\n${externalBroken.slice(0, 5).map(r => `• ${r.url} (${r.status})`).join('\n')}`,
        recommendation: 'Update or remove broken external links. Consider using a link monitoring service like Linkody or Dead Link Checker.',
        passed: false,
      })
    }
  } else {
    findings.push({
      id: uuidv4(),
      category: 'links',
      severity: 'info',
      title: 'No External Links Found',
      description: 'No external links were detected on the scanned page.',
      recommendation: '',
      passed: true,
    })
  }

  return { results, findings }
}
