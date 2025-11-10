"use client"

import { Suspense, useEffect, useState } from "react"
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

function GAProviderContent() {
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

  // Update GA consent when consent changes
  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return
    if (typeof window.gtag !== "function") return

    if (hasConsent) {
      window.gtag('consent', 'update', { 
        ad_storage: 'granted', 
        analytics_storage: 'granted' 
      })
    } else {
      window.gtag('consent', 'update', { 
        ad_storage: 'denied', 
        analytics_storage: 'denied' 
      })
    }
  }, [measurementId, hasConsent])

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

  // Only render GA scripts if measurementId exists (consent handled via consent mode)
  if (!measurementId) return null

  return (
    <>
      {/* GA Consent Mode v2 - default state (denied) */}
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', { 
            ad_storage: 'denied', 
            analytics_storage: 'denied', 
            wait_for_update: 500 
          });
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          if (!measurementId) return
          if (typeof window === "undefined") return
          if (typeof window.gtag !== "function") return
          
          // Initialize GA config
          window.gtag('js', new Date())
          window.gtag('config', measurementId, { send_page_view: false })
          
          // Send initial pageview if consent exists
          if (hasConsent) {
            const query = searchParams?.toString()
            const page_path = query ? `${pathname}?${query}` : pathname
            window.gtag("event", "page_view", { page_path })
            window.gtag('consent', 'update', { 
              ad_storage: 'granted', 
              analytics_storage: 'granted' 
            })
          }
        }}
      />
    </>
  )
}

export default function GAProvider() {
  return (
    <Suspense fallback={null}>
      <GAProviderContent />
    </Suspense>
  )
}


