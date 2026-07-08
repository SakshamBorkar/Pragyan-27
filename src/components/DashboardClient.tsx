'use client'

import { useState } from 'react'
import PIForm from './PIForm'
import PanelNav from './PanelNav'

interface Props {
  userName: string
  isAdmin?: boolean
}

export default function DashboardClient({ userName, isAdmin = false }: Props) {
  const [activePI, setActivePI] = useState<1 | 2 | null>(null)

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
      <PanelNav userName={userName} active="dashboard" isAdmin={isAdmin} />

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
