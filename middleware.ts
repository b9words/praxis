import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserRole, hasRequiredRole } from './lib/auth/middleware-helpers'
import { getRedirectUrlForLegacyContent } from './lib/content-mapping'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Handle legacy content route redirects FIRST (before auth)
  const pathname = request.nextUrl.pathname
  
  // Legacy article routes: /library/[articleId]
  const articleMatch = pathname.match(/^\/library\/([^\/]+)$/)
  if (articleMatch && articleMatch[1] !== 'curriculum' && articleMatch[1] !== 'bookmarks') {
    const articleId = articleMatch[1]
    const redirectUrl = getRedirectUrlForLegacyContent(articleId, 'article')
    if (redirectUrl) {
      const url = request.nextUrl.clone()
      url.pathname = redirectUrl
      return NextResponse.redirect(url, 301)
    }
  }
  
  // Legacy content routes: /library/content/[id]
  const contentMatch = pathname.match(/^\/library\/content\/([^\/]+)$/)
  if (contentMatch) {
    const contentId = contentMatch[1]
    const redirectUrl = getRedirectUrlForLegacyContent(contentId, 'content')
    if (redirectUrl) {
      const url = request.nextUrl.clone()
      url.pathname = redirectUrl
      return NextResponse.redirect(url, 301)
    }
  }
  
  // Legacy case study routes: /library/case-studies/[id]
  const caseStudyMatch = pathname.match(/^\/library\/case-studies\/([^\/]+)$/)
  if (caseStudyMatch) {
    const caseId = caseStudyMatch[1]
    const redirectUrl = getRedirectUrlForLegacyContent(caseId, 'case-study')
    if (redirectUrl) {
      const url = request.nextUrl.clone()
      url.pathname = redirectUrl
      return NextResponse.redirect(url, 301)
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/library', '/simulations', '/debrief', '/community', '/admin', '/profile']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Check application status for protected routes (except /apply and /application-pending)
  if (isProtectedPath && user && !request.nextUrl.pathname.startsWith('/apply') && !request.nextUrl.pathname.startsWith('/application-pending')) {
    try {
      // Use service role client to query database
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: application } = await supabaseAdmin
        .from('user_applications')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // If application exists and status is pending or rejected, redirect
      if (application) {
        if (application.status === 'pending') {
          const url = request.nextUrl.clone()
          url.pathname = '/application-pending'
          return NextResponse.redirect(url)
        }
        if (application.status === 'rejected') {
          const url = request.nextUrl.clone()
          url.pathname = '/apply'
          return NextResponse.redirect(url)
        }
        // If approved, allow access
      } else {
        // No application found - allow access if user has subscription
        // This handles legacy users who signed up before application system
        // Subscription check happens at route level
      }
    } catch (error) {
      // If check fails, allow access (fail open to avoid blocking legitimate users)
      console.error('Error checking application status:', error)
    }
  }

  // Role-based route protection
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const userRole = await getUserRole(user.id)
    
    if (!userRole || !hasRequiredRole(userRole, ['admin', 'editor'])) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users from auth pages to dashboard
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname === path)

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
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


