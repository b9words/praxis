import PublicHeader from '@/components/layout/PublicHeader'
import { SectionAccent } from '@/components/layout/SectionAccent'
import LedgerHero from '@/components/marketing/ledger-hero'
import LedgerArchive from '@/components/marketing/ledger-archive'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The CEO's Ledger | Execemy",
  description: 'A weekly, high-signal analysis of business strategy and capital allocation, delivered to your inbox. Free. Forever.',
  openGraph: {
    title: "The CEO's Ledger | Execemy",
    description: 'A weekly, high-signal analysis of business strategy and capital allocation, delivered to your inbox. Free. Forever.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://execemy.com'}/ledger`,
    siteName: 'Execemy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "The CEO's Ledger | Execemy",
    description: 'A weekly, high-signal analysis of business strategy and capital allocation, delivered to your inbox. Free. Forever.',
  },
}

export default function LedgerPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="border-b border-neutral-200 relative">
        <SectionAccent variant="vertical" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <LedgerHero />
        </div>
      </section>

      {/* Archive Section */}
      <section className="border-b border-neutral-200 bg-neutral-50 relative">
        <SectionAccent variant="edge" className="opacity-30" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
          <LedgerArchive />
        </div>
      </section>
    </div>
  )
}


