import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/canvas']

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')
  const pathname = request.nextUrl.pathname
  
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtectedPath && !sessionCookie) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  const response = NextResponse.next()
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 