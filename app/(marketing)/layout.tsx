import CookieConsentBanner from '@/components/layout/CookieConsentBanner'
import Footer from '@/components/layout/Footer'

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
    </>
  )
}

