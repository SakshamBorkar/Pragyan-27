'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PIForm from './PIForm'

interface Props {
  userName: string
}

export default function DashboardClient({ userName }: Props) {
  const router = useRouter()
  const [activePI, setActivePI] = useState<1 | 2 | null>(null)

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

  if (activePI) {
    return (
      <PIForm
        piNumber={activePI}
        onBack={() => setActivePI(null)}
      />
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Pragyan Events</p>
          <h1 className="text-xl font-semibold">PI Scheduler</h1>
        </div>
        <div className="flex items-center gap-3">
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

      <p className="text-gray-400 text-sm mb-6">
        Select the interview round to send a slot confirmation.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {([1, 2] as const).map(n => (
          <button
            key={n}
            onClick={() => setActivePI(n)}
            className="group bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 text-left hover:border-[#e8c97d44] hover:bg-[#1e1e35] transition-all"
          >
            <div className="text-4xl font-semibold text-[#e8c97d] mb-2">PI‑{n}</div>
            <div className="text-sm text-gray-300">
              {n === 1 ? 'First interview' : 'Second interview'}
            </div>
            <div className="text-xs text-gray-600 mt-1 group-hover:text-gray-400 transition-colors">
              Schedule slot →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
