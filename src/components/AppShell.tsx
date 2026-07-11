'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  userName: string
  isAdmin?: boolean
  children: React.ReactNode
}

export default function AppShell({ userName, isAdmin = false, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    await authFetch(getApiUrl('/api/auth/logout'), { method: 'POST' })
    localStorage.removeItem('pragyan_session')
    router.push('/login')
    router.refresh()
  }

  function navigate(href: string) {
    setMobileOpen(false)
    router.push(href)
  }

  const navLinkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return active
      ? 'bg-[#e8c97d11] text-[#e8c97d] border-[#e8c97d44]'
      : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-60 fixed inset-y-0 left-0 bg-[#12121f] border-r border-white/10 z-20">
        <div className="px-5 pt-6 pb-4 border-b border-white/5 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] truncate">{APP_NAME}</p>
            <p className="text-xs font-semibold text-white truncate">{APP_TAGLINE}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-full text-left text-sm border rounded-lg px-3 py-2.5 transition-colors ${navLinkClass('/dashboard')}`}
          >
            Home
          </button>
          <button
            onClick={() => router.push('/allotments')}
            className={`w-full text-left text-sm border rounded-lg px-3 py-2.5 transition-colors ${navLinkClass('/allotments')}`}
          >
            Allotments
          </button>
          <button
            onClick={() => router.push('/inductions')}
            className={`w-full text-left text-sm border rounded-lg px-3 py-2.5 transition-colors ${navLinkClass('/inductions')}`}
          >
            Inductions
          </button>
          <button
            onClick={() => router.push('/pi-completed')}
            className={`w-full text-left text-sm border rounded-lg px-3 py-2.5 transition-colors ${navLinkClass('/pi-completed')}`}
          >
            PI Completed
          </button>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className={`w-full text-left text-sm border rounded-lg px-3 py-2.5 transition-colors ${navLinkClass('/admin')}`}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#e8c97d44] flex items-center justify-center text-[#e8c97d] text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {isAdmin ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-400 border border-white/10 rounded-lg px-3 py-2.5 hover:bg-white/5 hover:text-white hover:border-white/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar — logo + hamburger only */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-[#12121f] border-b border-white/10 px-4 flex items-center justify-between mobile-header-safe">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-md shrink-0" />
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">{APP_NAME}</p>
            <p className="text-[11px] font-semibold text-white">{APP_TAGLINE}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          {/* Hamburger icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1"/>
            <rect y="9" width="20" height="2" rx="1"/>
            <rect y="15" width="20" height="2" rx="1"/>
          </svg>
        </button>
      </div>

      {/* Mobile sidebar drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#12121f] border-r border-white/10 flex flex-col h-full shadow-2xl">
            {/* Header */}
            <div className="px-5 pt-8 pb-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-lg shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{APP_NAME}</p>
                  <p className="text-xs font-semibold text-white">{APP_TAGLINE}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {[
                { href: '/dashboard', label: 'Home' },
                { href: '/allotments', label: 'Allotments' },
                { href: '/inductions', label: 'Inductions' },
                { href: '/pi-completed', label: 'PI Completed' },
                ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
              ].map(({ href, label }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className={`w-full text-left text-sm border rounded-xl px-4 py-3 transition-colors ${navLinkClass(href)}`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* User info + sign out */}
            <div className="px-3 py-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#e8c97d44] flex items-center justify-center text-[#e8c97d] text-xs font-semibold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {isAdmin ? 'Admin' : 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setMobileOpen(false); handleLogout() }}
                className="w-full text-left text-sm text-gray-400 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/5 hover:text-white hover:border-white/20 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-56 lg:ml-60 pt-14 md:pt-0 pb-6 md:pb-0 min-h-screen mobile-main-safe">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
