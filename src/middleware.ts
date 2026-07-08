import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME, isAdmin } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/send-otp']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin(session)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/allotments/:path*', '/admin/:path*', '/api/admin/:path*', '/api/assignments/:path*', '/api/pi/:path*'],
}
