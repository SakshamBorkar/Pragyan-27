'use client'

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

  const navLinkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`)
    return active
      ? 'bg-[#e8c97d11] text-[#e8c97d] border-[#e8c97d44]'
      : 'text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-60 fixed inset-y-0 left-0 bg-[#12121f] border-r border-white/10 z-20">
        <div className="px-5 pt-6 pb-4 border-b border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{APP_NAME}</p>
          <p className="text-sm font-semibold text-white mt-1">{APP_TAGLINE}</p>
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

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-[#12121f] border-b border-white/10 px-3 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-shrink">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate">{APP_NAME}</p>
          <p className="text-xs font-semibold truncate">{APP_TAGLINE}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
            className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${navLinkClass('/dashboard')}`}
          >
            Home
          </button>
          <button
            onClick={() => router.push('/allotments')}
            className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${navLinkClass('/allotments')}`}
          >
            Allotments
          </button>
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${navLinkClass('/admin')}`}
            >
              Admin
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom-left sign out */}
      <button
        onClick={handleLogout}
        className="md:hidden fixed bottom-4 left-4 z-20 text-xs text-gray-400 border border-white/10 bg-[#12121f] rounded-lg px-4 py-2.5 hover:text-white hover:border-white/20 transition-colors shadow-lg"
      >
        Sign out
      </button>

      <main className="flex-1 md:ml-56 lg:ml-60 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
