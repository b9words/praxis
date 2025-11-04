/**
 * Analytics service wrapper
 * Supports PostHog by default, can be extended with other providers
 */

type AnalyticsEvent = 
  | 'simulation_started'
  | 'simulation_completed'
  | 'lesson_viewed'
  | 'lesson_completed'
  | 'debrief_shared'
  | 'application_submitted'
  | 'subscription_started'
  | 'user_signed_up'
  | 'dashboard_card_clicked'

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined
}

interface AnalyticsService {
  identify(userId: string, traits?: Record<string, any>): void
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void
  page(name: string, properties?: AnalyticsProperties): void
}

class PostHogAnalyticsService implements AnalyticsService {
  private apiKey: string | null = null
  private host: string = 'https://us.i.posthog.com'
  private initialized: boolean = false

  constructor() {
    // Only initialize on client side
    // Note: PostHog initialization for marketing pages is handled by CookieConsentBanner
    // This service is kept for backwards compatibility and authenticated app analytics
    if (typeof window !== 'undefined') {
      this.apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || null
      this.host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
      
      // Check if we're on a marketing page (should check consent)
      // For authenticated app pages, we can initialize without consent (legitimate interest)
      const isMarketingPage = this.isMarketingPage()
      
      if (this.apiKey && !isMarketingPage) {
        // Authenticated app - initialize without consent (legitimate interest)
        this.initialize()
      } else if (this.apiKey && isMarketingPage) {
        // Marketing page - only initialize if consent given
        // CookieConsentBanner will handle initialization via cookie event
        this.checkConsentAndInitialize()
      }
    }
  }

  private isMarketingPage(): boolean {
    if (typeof window === 'undefined') return false
    const pathname = window.location.pathname
    // Marketing pages don't start with /dashboard, /library, /simulations, /profile, /admin
    const marketingPaths = ['/', '/pricing', '/about', '/contact', '/legal', '/signup', '/login']
    const appPaths = ['/dashboard', '/library', '/simulations', '/profile', '/admin', '/onboarding']
    
    if (appPaths.some(path => pathname.startsWith(path))) return false
    if (marketingPaths.some(path => pathname.startsWith(path))) return true
    // Default: assume marketing if not clearly an app page
    return !pathname.startsWith('/api')
  }

  private checkConsentAndInitialize() {
    if (this.initialized || typeof window === 'undefined') return
    
    // Check if analytics consent cookie exists
    const hasConsent = this.hasAnalyticsConsent()
    if (hasConsent) {
      this.initialize()
    }
    
    // Listen for consent changes
    window.addEventListener('cc:onConsent', () => {
      if (this.hasAnalyticsConsent() && !this.initialized) {
        this.initialize()
      }
    })
  }

  private hasAnalyticsConsent(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check cookie
    const cookies = document.cookie.split(';')
    const analyticsCookie = cookies.find(c => c.trim().startsWith('cc_analytics='))
    if (analyticsCookie) {
      return analyticsCookie.includes('cc_analytics=1')
    }
    
    // Check localStorage (our custom implementation uses this)
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

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return

    // Don't initialize if PostHog is already initialized (e.g., by CookieConsentBanner)
    if ((window as any).posthog) {
      this.initialized = true
      return
    }

    try {
      // Dynamically import PostHog (client-side only)
      import('posthog-js').then(({ default: posthog }) => {
        if (posthog && this.apiKey && !this.initialized) {
          const isProduction = process.env.NODE_ENV === 'production'
          
          posthog.init(this.apiKey, {
            api_host: this.host,
            // Prevent auto pageviews - we send manually via router
            capture_pageview: false,
            // Autocapture: only in dev, disabled in production
            autocapture: isProduction ? false : { capture_forms: true } as any,
            // Mask all text in production for privacy
            mask_all_text: isProduction,
            // Don't capture console logs or performance metrics
            capture_performance: false,
            // Session recording enabled with masking for balanced privacy approach
            disable_session_recording: false,
            loaded: (ph) => {
              if (process.env.NODE_ENV === 'development') {
                ph.debug()
              }
            },
          })
          this.initialized = true
        }
      }).catch((error) => {
        console.error('Failed to load PostHog:', error)
      })
    } catch (error) {
      console.error('PostHog initialization error:', error)
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === 'undefined') return
    
    // Check if PostHog is available (either initialized here or by CookieConsentBanner)
    const posthog = (window as any).posthog
    if (!posthog) return

    try {
      posthog.identify(userId, traits)
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }

  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined') return
    
    // Check if PostHog is available (either initialized here or by CookieConsentBanner)
    const posthog = (window as any).posthog
    if (!posthog) return

    try {
      posthog.capture(event, properties)
    } catch (error) {
      console.error('PostHog track error:', error)
    }
  }

  page(name: string, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined') return
    
    // Check if PostHog is available (either initialized here or by CookieConsentBanner)
    const posthog = (window as any).posthog
    if (!posthog) return

    try {
      posthog.capture('$pageview', {
        page_name: name,
        ...properties,
      })
    } catch (error) {
      console.error('PostHog page error:', error)
    }
  }
}

// Retry helper for server-side analytics requests
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2
): Promise<Response | null> {
  const delays = [200, 800] // ms delays for retries
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // Success - return immediately
      if (response.ok) {
        return response
      }
      
      // 5xx errors - retry if attempts remaining
      if (response.status >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]))
        continue
      }
      
      // 4xx errors should not be retried - return as-is
      return response
    } catch (error) {
      // Network error - retry if attempts remaining
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]))
        continue
      }
      throw error
    }
  }
  
  return null
}

// Server-side analytics (for tracking server events)
class ServerAnalyticsService implements AnalyticsService {
  private apiKey: string | null = null
  private host: string

  constructor() {
    this.apiKey = process.env.POSTHOG_API_KEY || null
    this.host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    if (!this.apiKey) return

    try {
      await fetchWithRetry(`${this.host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          event: '$identify',
          distinct_id: userId,
          properties: {
            ...traits,
            $set: traits,
          },
        }),
      })
    } catch (error) {
      // Silently fail - analytics should not block application flow
      if (process.env.NODE_ENV === 'development') {
        console.error('Server analytics identify error:', error)
      }
    }
  }

  async track(event: AnalyticsEvent, properties?: AnalyticsProperties): Promise<void> {
    if (!this.apiKey) return

    try {
      await fetchWithRetry(`${this.host}/capture/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          event,
          distinct_id: properties?.userId as string || 'anonymous',
          properties: {
            ...properties,
            $lib: 'execemy',
          },
        }),
      })
    } catch (error) {
      // Silently fail - analytics should not block application flow
      if (process.env.NODE_ENV === 'development') {
        console.error('Server analytics track error:', error)
      }
    }
  }

  page(name: string, properties?: AnalyticsProperties): void {
    // Server-side page tracking not typically needed
    // Page views are tracked client-side
  }
}

// Client-side instance
let clientAnalytics: AnalyticsService | null = null
if (typeof window !== 'undefined') {
  clientAnalytics = new PostHogAnalyticsService()
}

// Server-side instance
const serverAnalytics = new ServerAnalyticsService()

/**
 * Client-side analytics functions
 */
export const analytics = {
  identify: (userId: string, traits?: Record<string, any>) => {
    clientAnalytics?.identify(userId, traits)
  },
  
  track: (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
    clientAnalytics?.track(event, properties)
  },
  
  page: (name: string, properties?: AnalyticsProperties) => {
    clientAnalytics?.page(name, properties)
  },
}

/**
 * Server-side analytics functions
 */
export const serverAnalyticsTracker = {
  identify: (userId: string, traits?: Record<string, any>) => {
    return serverAnalytics.identify(userId, traits)
  },
  
  track: (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
    return serverAnalytics.track(event, properties)
  },
}

/**
 * Common event tracking helpers
 */
export const trackEvents = {
  simulationStarted: (simulationId: string, caseId: string, userId: string) => {
    analytics.track('simulation_started', { simulationId, caseId, userId })
  },
  
  simulationCompleted: (simulationId: string, caseId: string, userId: string) => {
    analytics.track('simulation_completed', { simulationId, caseId, userId })
  },
  
  lessonViewed: (lessonId: string, domain: string, module: string, userId: string) => {
    analytics.track('lesson_viewed', { lessonId, domain, module, userId })
  },
  
  lessonCompleted: (lessonId: string, domain: string, module: string, userId: string) => {
    analytics.track('lesson_completed', { lessonId, domain, module, userId })
  },
  
  debriefShared: (simulationTitle: string, platform: string, userId?: string) => {
    analytics.track('debrief_shared', { 
      simulationTitle, 
      platform,
      ...(userId ? { userId } : {})
    })
  },
  
  applicationSubmitted: (applicationId: string, userId?: string) => {
    analytics.track('application_submitted', { applicationId, userId })
  },
  
  subscriptionStarted: (subscriptionId: string, planId: string, userId: string) => {
    analytics.track('subscription_started', { subscriptionId, planId, userId })
  },
  
  userSignedUp: (userId: string, email: string) => {
    // Balanced privacy: Track event with userId only, don't send email in properties
    analytics.track('user_signed_up', { userId })
    // Identify user but don't pass email in traits (PostHog can hash it separately if needed)
    analytics.identify(userId, {})
  },

  dashboardCardClicked: (cardType: string, cardId: string, shelfName?: string, userId?: string) => {
    analytics.track('dashboard_card_clicked', {
      cardType,
      cardId,
      shelfName,
      ...(userId ? { userId } : {}),
    })
  },
}

