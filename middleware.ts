import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkSubscription } from './lib/auth/middleware-helpers'
import { getRedirectUrlForLegacyContent } from './lib/content-mapping'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // STEP 1: Define public paths that bypass ALL checks (including case-studies)
  const publicPaths = [
    '/library/curriculum',
    '/library/case-studies',  // Case studies listing - ALWAYS public
    '/library/paths',
    '/profile/billing',
    '/dashboard',
    '/residency',
  ]
  
  // If path starts with any public path, bypass ALL middleware logic
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // STEP 2: Handle legacy redirects (ONLY for non-public paths)
  // Legacy article routes: /library/[articleId] (but not curriculum, bookmarks, case-studies)
  const articleMatch = pathname.match(/^\/library\/([^\/]+)$/)
  if (articleMatch) {
    const articleId = articleMatch[1]
    // Skip if it's a known public route
    if (articleId !== 'curriculum' && articleId !== 'bookmarks' && articleId !== 'case-studies') {
      const redirectUrl = getRedirectUrlForLegacyContent(articleId, 'article')
      if (redirectUrl) {
        return NextResponse.redirect(new URL(redirectUrl, request.url), 301)
      }
    }
  }
  
  // Legacy content routes: /library/content/[id]
  const contentMatch = pathname.match(/^\/library\/content\/([^\/]+)$/)
  if (contentMatch) {
    const contentId = contentMatch[1]
    const redirectUrl = getRedirectUrlForLegacyContent(contentId, 'content')
    if (redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, request.url), 301)
    }
  }
  
  // Legacy case study routes: /library/case-studies/[id] - only redirect if mapping exists
  const caseStudyMatch = pathname.match(/^\/library\/case-studies\/([^\/]+)$/)
  if (caseStudyMatch) {
    const caseId = caseStudyMatch[1]
    const { getCurriculumPathForLegacyContent } = await import('./lib/content-mapping')
    const curriculumPath = getCurriculumPathForLegacyContent(caseId, 'case-study')
    // Only redirect if there's an actual mapping (not fallback)
    if (curriculumPath) {
      const redirectUrl = `/library/curriculum/${curriculumPath.domain}/${curriculumPath.module}/${curriculumPath.lesson}`
      return NextResponse.redirect(new URL(redirectUrl, request.url), 301)
    }
    // If no mapping, let it through to the page handler
  }

  // STEP 3: Auth and subscription checks (only for protected paths)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  
  // Set Sentry user context
  if (user) {
    try {
      const { setUser } = await import('@/lib/monitoring')
      setUser({
        id: user.id,
        email: user.email || undefined,
        username: user.user_metadata?.username || user.user_metadata?.preferred_username || undefined,
      })
    } catch (error) {
      // Sentry not available - ignore
    }
  }

  // STEP 4: Subscription gating (only for logged-in users on protected paths)
  if (user) {
    const protectedPaths = ['/library', '/case-studies']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    
    if (isProtectedPath) {
      try {
        // Check if user is admin - admins bypass subscription checks
        // Do this FIRST before any other checks to ensure admins always get through
        const { getUserRole } = await import('./lib/auth/middleware-helpers')
        let userRole: string | null = null
        let roleCheckFailed = false
        
        try {
          userRole = await getUserRole(user.id)
          // Log in development for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[middleware] User ${user.id} role: ${userRole}`)
          }
        } catch (roleError: any) {
          // If role check fails, log but fail open (allow access)
          // This prevents blocking legitimate users due to DB issues
          console.error('Error checking user role in middleware:', roleError?.message || roleError)
          roleCheckFailed = true
          // Fail open - if we can't check role, allow access to prevent blocking admins
          // This is especially important for admins who might have permission issues
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[middleware] Role check failed for user ${user.id}, allowing access (fail open)`)
          }
          return NextResponse.next()
        }
        
        if (userRole === 'admin') {
          // Admins can access all resources without subscription
          if (process.env.NODE_ENV === 'development') {
            console.log(`[middleware] Admin user ${user.id} bypassing subscription check`)
          }
          return NextResponse.next()
        }
        
        // If role is null (user not found), also fail open to prevent blocking
        if (userRole === null) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[middleware] No role found for user ${user.id}, allowing access (fail open)`)
          }
          return NextResponse.next()
        }
        
        // Only check subscription if we successfully determined user is NOT admin
        const subscriptionStatus = await checkSubscription(user.id)
        
        if (!subscriptionStatus.isActive) {
          // Check if this is weekly briefing content
          // Use try-catch to handle any errors gracefully
          let briefing = null
          try {
            // Use middleware-safe version that doesn't use caching
            const { getCurrentBriefingForMiddleware } = await import('./lib/briefing')
            briefing = await getCurrentBriefingForMiddleware()
          } catch (briefingError) {
            // If briefing check fails, log but don't block access
            console.error('Error fetching briefing in middleware:', briefingError)
          }
          
          if (briefing) {
            // Check if path matches weekly briefing module lessons
            const lessonMatch = pathname.match(/^\/library\/curriculum\/([^\/]+)\/([^\/]+)\/([^\/]+)$/)
            if (lessonMatch) {
              const [, domainId, moduleId] = lessonMatch
              if (domainId === briefing.domainId && moduleId === briefing.moduleId) {
                return NextResponse.next()
              }
            }
            
            // Check if path matches weekly briefing case
            const caseOverviewMatch = pathname.match(/^\/case-studies\/([^\/]+)$/)
            const caseTasksMatch = pathname.match(/^\/case-studies\/([^\/]+)\/tasks$/)
            if ((caseOverviewMatch && caseOverviewMatch[1] === briefing.caseId) ||
                (caseTasksMatch && caseTasksMatch[1] === briefing.caseId)) {
              return NextResponse.next()
            }
          }
          
          // Not weekly briefing content - redirect to billing
          const url = new URL('/profile/billing', request.url)
          url.searchParams.set('returnUrl', pathname)
          return NextResponse.redirect(url)
        }
      } catch (error) {
        // If subscription check fails, allow access (fail open)
        // But first check if user is admin one more time as fallback
        try {
          const { getUserRole } = await import('./lib/auth/middleware-helpers')
          const userRole = await getUserRole(user.id)
          if (userRole === 'admin') {
            return NextResponse.next()
          }
        } catch {
          // If we can't check role, fail open and allow access
        }
        console.error('Error checking subscription in middleware:', error)
        // Fail open - allow access if there's an error
        return NextResponse.next()
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
