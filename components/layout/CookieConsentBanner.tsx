'use client'

import { useEffect, useState } from 'react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
}

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = getConsent()
    if (!consent) {
      setShowBanner(true)
    } else {
      // If consent was given, initialize analytics if analytics consent exists
      if (consent.analytics) {
        initializeAnalytics()
      }
    }

    // Listen for consent changes
    window.addEventListener('cc:onConsent', handleConsentChange)
    return () => {
      window.removeEventListener('cc:onConsent', handleConsentChange)
    }
  }, [])

  const getConsent = (): CookiePreferences | null => {
    if (typeof window === 'undefined') return null
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) return null
    try {
      return JSON.parse(consent)
    } catch {
      return null
    }
  }

  const saveConsent = (preferences: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(preferences))
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setConsent(preferences)
  }

  const setConsent = (preferences: CookiePreferences) => {
    // Set cookies to match preferences
    if (preferences.analytics) {
      document.cookie = 'cc_analytics=1; path=/; max-age=31536000' // 1 year
    } else {
      document.cookie = 'cc_analytics=0; path=/; max-age=31536000'
      // Clear PostHog cookies if they exist
      clearAnalyticsCookies()
    }
    
    // Update GA consent if gtag is available
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      if (preferences.analytics) {
        (window as any).gtag('consent', 'update', { 
          ad_storage: 'granted', 
          analytics_storage: 'granted' 
        })
      } else {
        (window as any).gtag('consent', 'update', { 
          ad_storage: 'denied', 
          analytics_storage: 'denied' 
        })
      }
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('cc:onConsent', { detail: preferences }))
    
    if (preferences.analytics) {
      initializeAnalytics()
    }
  }

  const clearAnalyticsCookies = () => {
    // Clear PostHog cookies
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name.startsWith('_ph_')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    })
  }

  const initializeAnalytics = () => {
    // Only initialize if PostHog key exists and not already initialized
    if (typeof window === 'undefined') return
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    if ((window as any).posthog) return

    import('posthog-js').then(({ default: posthog }) => {
      if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        const isProduction = process.env.NODE_ENV === 'production'
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          // Prevent auto pageviews - we send manually via router
          capture_pageview: false,
          // Autocapture: only in dev, disabled in production
          autocapture: isProduction ? false : { capture_forms: true } as any,
          mask_all_text: isProduction,
          capture_performance: false,
          disable_session_recording: false,
        })
        ;(window as any).posthog = posthog
      }
    }).catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load PostHog:', error)
      }
    })
  }

  const handleConsentChange = () => {
    const consent = getConsent()
    if (consent?.analytics) {
      initializeAnalytics()
    }
  }

  const acceptAll = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: true,
    }
    saveConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const rejectAll = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      analytics: false,
    }
    saveConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const savePreferences = (preferences: CookiePreferences) => {
    preferences.necessary = true // Always required
    saveConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  if (!showBanner && !showSettings) return null

  return (
    <>
      {/* Consent Banner - Fixed to left side, non-blocking */}
      {showBanner && !showSettings && (
        <div className="fixed left-4 bottom-4 z-50 max-w-sm">
          <div className="bg-white rounded-none border border-neutral-200 shadow-lg">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">Cookie Preferences</h2>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We use cookies to analyze our marketing site performance. Essential cookies are required.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-none flex-1"
                >
                  Customize
                </button>
                <button
                  onClick={acceptAll}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-none flex-1"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Still modal but with less intrusive overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-neutral-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-900">Cookie Preferences</h2>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    if (!getConsent()) {
                      setShowBanner(true)
                    }
                  }}
                  className="text-neutral-500 hover:text-neutral-700 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <CookiePreferencesForm
                initialPreferences={getConsent() || { necessary: true, analytics: false }}
                onSave={savePreferences}
                onCancel={() => {
                  setShowSettings(false)
                  if (!getConsent()) {
                    setShowBanner(true)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface CookiePreferencesFormProps {
  initialPreferences: CookiePreferences
  onSave: (preferences: CookiePreferences) => void
  onCancel: () => void
}

function CookiePreferencesForm({ initialPreferences, onSave, onCancel }: CookiePreferencesFormProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(initialPreferences)

  return (
    <div className="space-y-6">
      {/* Necessary Cookies */}
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-medium text-neutral-900 mb-1">Necessary Cookies</h3>
            <p className="text-sm text-neutral-600">
              These cookies are essential for the site to function, such as for authentication sessions.
            </p>
          </div>
          <input
            type="checkbox"
            checked={true}
            disabled
            className="ml-4 h-5 w-5 border-neutral-300 rounded text-neutral-900 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Analytics Cookies */}
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-medium text-neutral-900 mb-1">Analytics Cookies</h3>
            <p className="text-sm text-neutral-600">
              These cookies help us understand how you use our marketing pages to improve our messaging.
            </p>
          </div>
          <input
            type="checkbox"
            checked={preferences.analytics}
            onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
            className="ml-4 h-5 w-5 border-neutral-300 rounded text-neutral-900 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-none"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const allPreferences: CookiePreferences = { necessary: true, analytics: true }
            onSave(allPreferences)
          }}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-none"
        >
          Accept All
        </button>
        <button
          onClick={() => {
            const nonePreferences: CookiePreferences = { necessary: true, analytics: false }
            onSave(nonePreferences)
          }}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors rounded-none"
        >
          Reject All
        </button>
        <button
          onClick={() => onSave(preferences)}
          className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-none flex-1"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}

