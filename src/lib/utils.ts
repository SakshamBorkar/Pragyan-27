/**
 * Capacitor / mobile utilities
 * --------------------------------------------------
 * getApiUrl  – resolves API paths to absolute URLs when running inside a
 *              Capacitor webview, keeps them relative for normal browsers.
 * authFetch  – wrapper around fetch() that attaches the Bearer token
 *              stored in localStorage so mobile clients can authenticate.
 */

export function getApiUrl(path: string): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`

  // Next.js trailingSlash causes redirects on API paths, which breaks CORS
  // preflights. Append a trailing slash to avoid the redirect.
  if (cleanPath.startsWith('/api/') && !cleanPath.endsWith('/')) {
    cleanPath = `${cleanPath}/`
  }

  if (typeof window !== 'undefined') {
    // Detect Capacitor webviews (Android / iOS)
    const isCapacitor =
      (window as any).Capacitor ||
      window.location.protocol.startsWith('capacitor') ||
      (window.location.hostname === 'localhost' && !window.location.port)

    if (!isCapacitor) {
      // Normal browser → relative path works fine
      return cleanPath
    }
  }

  // Mobile / Capacitor → need absolute backend URL
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'https://pragyan-27.vercel.app'
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBase}${cleanPath}`
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pragyan_session')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
