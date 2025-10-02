import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require trial access or payment
const protectedRoutes = [
  '/form-generation',
  '/next-steps'
]

// Routes that require authentication but not necessarily trial access
const authRoutes = [
  '/information-collection',
  '/payment'
]

// Routes that require form data to be completed
const formDataRoutes = [
  '/payment',
  '/form-generation',
  '/next-steps'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route requires authentication or trial access
  const requiresAuth = authRoutes.some(route => pathname.startsWith(route))
  const requiresTrial = protectedRoutes.some(route => pathname.startsWith(route))
  const requiresFormData = formDataRoutes.some(route => pathname.startsWith(route))
  
  if (requiresAuth || requiresTrial) {
    // For now, we'll let the client-side handle the authentication checks
    // This middleware can be enhanced later to check auth tokens server-side
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 