import CookieConsentBanner from '@/components/layout/CookieConsentBanner'
import Footer from '@/components/layout/Footer'
import GAProvider from '@/components/providers/GAProvider'
import { Suspense } from 'react'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
      <CookieConsentBanner />
      <Suspense fallback={null}>
        <GAProvider />
      </Suspense>
    </>
  )
}

