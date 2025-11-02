"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export default function GAProvider() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!measurementId) return
    if (typeof window === "undefined") return
    if (typeof window.gtag !== "function") return

    const query = searchParams?.toString()
    const page_path = query ? `${pathname}?${query}` : pathname

    window.gtag("event", "page_view", {
      page_path,
    })
  }, [measurementId, pathname, searchParams])

  if (!measurementId) return null

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


