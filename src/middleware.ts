import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME, isAdmin } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/send-otp']

// Origins allowed for Capacitor webviews
const ALLOWED_ORIGINS = [
  'http://localhost',
  'capacitor://localhost',
  'https://localhost',
]

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin')

  // Handle CORS preflight for API routes
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    })
  }

  // Public paths — allow through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next()
    if (pathname.startsWith('/api/')) {
      const cors = getCorsHeaders(origin)
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v))
    }
    return res
  }

  // Read session token from cookie OR Authorization header
  let token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const auth = req.headers.get('authorization') || ''
    if (auth.startsWith('Bearer ')) {
      token = auth.slice(7)
    }
  }

  const session = token ? await verifyToken(token) : null

  if (!session) {
    // API routes get a 401 JSON response (not a redirect)
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
      const cors = getCorsHeaders(origin)
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdmin(session)) {
      if (pathname.startsWith('/api/')) {
        const res = NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
        const cors = getCorsHeaders(origin)
        Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v))
        return res
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  const res = NextResponse.next()
  if (pathname.startsWith('/api/')) {
    const cors = getCorsHeaders(origin)
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v))
  }
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/allotments/:path*', '/admin/:path*', '/api/admin/:path*', '/api/assignments/:path*', '/api/pi/:path*'],
}
