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
    if (typeof window !== 'undefined') {
      this.apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY || null
      this.host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
      
      if (this.apiKey) {
        this.initialize()
      }
    }
  }

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return

    try {
      // Dynamically import PostHog (client-side only)
      import('posthog-js').then(({ default: posthog }) => {
        if (posthog && this.apiKey) {
          posthog.init(this.apiKey, {
            api_host: this.host,
            loaded: (posthog) => {
              if (process.env.NODE_ENV === 'development') {
                posthog.debug()
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
    if (typeof window === 'undefined' || !this.initialized) return

    try {
      import('posthog-js').then(({ default: posthog }) => {
        posthog?.identify(userId, traits)
      })
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }

  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined' || !this.initialized) return

    try {
      import('posthog-js').then(({ default: posthog }) => {
        posthog?.capture(event, properties)
      })
    } catch (error) {
      console.error('PostHog track error:', error)
    }
  }

  page(name: string, properties?: AnalyticsProperties): void {
    if (typeof window === 'undefined' || !this.initialized) return

    try {
      import('posthog-js').then(({ default: posthog }) => {
        posthog?.capture('$pageview', {
          page_name: name,
          ...properties,
        })
      })
    } catch (error) {
      console.error('PostHog page error:', error)
    }
  }
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
      await fetch(`${this.host}/capture/`, {
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
      console.error('Server analytics identify error:', error)
    }
  }

  async track(event: AnalyticsEvent, properties?: AnalyticsProperties): Promise<void> {
    if (!this.apiKey) return

    try {
      await fetch(`${this.host}/capture/`, {
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
            $lib: 'praxis-platform',
          },
        }),
      })
    } catch (error) {
      console.error('Server analytics track error:', error)
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
    analytics.track('user_signed_up', { userId, email })
    analytics.identify(userId, { email })
  },
}

