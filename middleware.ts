import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Add debug logging
    console.log('Middleware - Session check:', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      email: session?.user?.email,
    })

    // Protected routes that require authentication
    const protectedRoutes = [
      '/dashboard',
      '/task-manager',
      '/roadmap',
      '/pitch-deck',
      '/business-plan',
      '/survey',
    ]
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
    console.log('Middleware - Is protected route:', isProtectedRoute)

    // If accessing a protected route without a session, redirect to login
    if (isProtectedRoute && !session) {
      console.log('Middleware - Redirecting to login: No session for protected route')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If accessing login/signup pages with an active session, redirect to dashboard
    if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') && session) {
      console.log('Middleware - Redirecting to dashboard: Active session on auth page')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware - Auth error:', error)
    // On error, allow request to continue but log the error
    return res
  }
}

// Specify which routes this middleware should run for
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/task-manager/:path*',
    '/roadmap/:path*',
    '/pitch-deck/:path*',
    '/business-plan/:path*',
    '/survey/:path*',
  ],
}
