import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
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


