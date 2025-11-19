import CookieConsentBanner from '@/components/layout/CookieConsentBanner'
import Footer from '@/components/layout/Footer'
import PublicHeader from '@/components/layout/PublicHeader'
import Container from '@/components/layout/Container'
import GAProvider from '@/components/providers/GAProvider'
import PostHogPageview from '@/components/providers/PostHogPageview'
import { Suspense } from 'react'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-density="comfortable">
      <PublicHeader />
      <Container variant="marketing">{children}</Container>
      <Footer />
      <CookieConsentBanner />
      <Suspense fallback={null}>
        <GAProvider />
      </Suspense>
      <PostHogPageview />
    </div>
  )
}

