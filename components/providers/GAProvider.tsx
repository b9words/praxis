"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check localStorage for consent
  try {
    const consent = localStorage.getItem('cookie_consent')
    if (consent) {
      const parsed = JSON.parse(consent)
      return parsed.analytics === true
    }
  } catch {
    // Ignore parse errors
  }
  
  return false
}

export default function GAProvider() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hasConsent, setHasConsent] = useState(false)

  // Check consent on mount and listen for changes
  useEffect(() => {
    const checkConsent = () => {
      setHasConsent(hasAnalyticsConsent())
    }

    // Check initial consent
    checkConsent()

    // Listen for consent changes
    const handleConsentChange = () => {
      checkConsent()
    }

    window.addEventListener('cc:onConsent', handleConsentChange)

    return () => {
      window.removeEventListener('cc:onConsent', handleConsentChange)
    }
  }, [])

  useEffect(() => {
    if (!measurementId || !hasConsent) return
    if (typeof window === "undefined") return
    if (typeof window.gtag !== "function") return

    const query = searchParams?.toString()
    const page_path = query ? `${pathname}?${query}` : pathname

    window.gtag("event", "page_view", {
      page_path,
    })
  }, [measurementId, pathname, searchParams, hasConsent])

  // Only render GA if we have consent
  if (!measurementId || !hasConsent) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (!measurementId) return
          if (typeof window === "undefined") return
          if (typeof window.gtag !== "function") return
          const query = searchParams?.toString()
          const page_path = query ? `${pathname}?${query}` : pathname
          window.gtag("event", "page_view", { page_path })
        }}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}


