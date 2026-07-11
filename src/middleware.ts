import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME, isAdmin } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/send-otp',
  '/api/auth/me',
  '/api/auth/logout',
]

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false

  // Strict check for allowed static origins or local hosts with ports
  const allowed = [
    'http://localhost',
    'capacitor://localhost',
    'https://localhost',
  ]
  if (allowed.some(o => origin === o || origin.startsWith(o + ':'))) return true

  try {
    const url = new URL(origin)
    const hostname = url.hostname

    // Allow localhost/127.0.0.1 loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true
    }

    // Allow private network IPs for mobile testing (e.g. 192.168.x.x, 10.x.x.x)
    const isPrivateIp =
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)

    if (isPrivateIp) return true

    // Allow capacitor custom scheme
    if (url.protocol === 'capacitor:') return true
  } catch {
    // Invalid URL format
  }

  return false
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }

  if (origin && isAllowedOrigin(origin)) {
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
  matcher: ['/dashboard/:path*', '/allotments/:path*', '/admin/:path*', '/inductions/:path*', '/pi-completed/:path*', '/api/:path*'],
}
