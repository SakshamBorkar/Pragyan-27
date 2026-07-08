'use client'

import { useRouter } from 'next/navigation'

interface Props {
  userName: string
  active: 'admin' | 'dashboard'
  isAdmin?: boolean
}

export default function PanelNav({ userName, active, isAdmin = false }: Props) {
  const router = useRouter()

  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const linkClass = (panel: 'admin' | 'dashboard') =>
    panel === active
      ? 'text-[#e8c97d] border-[#e8c97d44] bg-[#e8c97d11]'
      : 'text-gray-400 border-white/10 hover:border-white/20 hover:text-white'

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Pragyan Events</p>
          <h1 className="text-xl font-semibold">
            {active === 'admin' ? 'Admin Panel' : 'User Panel'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <nav className="hidden sm:flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${linkClass('admin')}`}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${linkClass('dashboard')}`}
            >
              PI Scheduler
            </button>
          </nav>
          <div className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-[#e8c97d44] flex items-center justify-center text-[#e8c97d] text-xs font-semibold">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 border border-white/10 rounded-lg px-3 py-1.5 hover:border-white/20 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="sm:hidden flex items-center gap-2 mt-4">
        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${linkClass('admin')}`}
          >
            Admin Panel
          </button>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${linkClass('dashboard')}`}
        >
          PI Scheduler
        </button>
      </nav>
    </div>
  )
}
