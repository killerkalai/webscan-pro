import Link from 'next/link'
import { Wifi } from 'lucide-react'

// Add this component to the landing page hero section
export function ConnectCTA() {
  return (
    <Link
      href="/connect"
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent/30 bg-accent/5 text-accent text-sm font-mono hover:bg-accent/10 transition-all"
    >
      <Wifi size={14} />
      Connect your site for 24/7 monitoring
    </Link>
  )
}
