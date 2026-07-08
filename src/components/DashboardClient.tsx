'use client'

import { useEffect, useState } from 'react'
import PIForm from './PIForm'
import PanelNav from './PanelNav'
import AssignedDatesPanel from './AssignedDatesPanel'

interface Props {
  userName: string
  isAdmin?: boolean
}

export default function DashboardClient({ userName, isAdmin = false }: Props) {
  const [activePI, setActivePI] = useState<1 | 2 | null>(null)
  const [assignedDates, setAssignedDates] = useState<string[]>([])
  const [loadingDates, setLoadingDates] = useState(!isAdmin)

  useEffect(() => {
    if (isAdmin) return
    async function loadAssignments() {
      try {
        const res = await fetch('/api/assignments/me')
        const data = await res.json()
        if (res.ok) setAssignedDates(data.dates ?? [])
      } finally {
        setLoadingDates(false)
      }
    }
    loadAssignments()
  }, [isAdmin])

  if (activePI) {
    return (
      <PIForm
        piNumber={activePI}
        onBack={() => setActivePI(null)}
        userName={userName}
        assignedDates={isAdmin ? undefined : assignedDates}
        restrictToAssignedDates={!isAdmin}
      />
    )
  }

  const canSchedule = isAdmin || assignedDates.length > 0

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <PanelNav userName={userName} active="dashboard" isAdmin={isAdmin} />

      {!isAdmin && (
        <AssignedDatesPanel
          userName={userName}
          dates={assignedDates}
          loading={loadingDates}
        />
      )}

      <p className="text-gray-400 text-sm mb-6">
        {canSchedule
          ? assignedDates.length > 0 && !isAdmin
            ? 'Pick a PI round below to send slot confirmations for your allotted date(s).'
            : 'Select the interview round to send a slot confirmation.'
          : 'You can schedule PI slots once an admin allots you a date.'}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {([1, 2] as const).map(n => (
          <button
            key={n}
            onClick={() => canSchedule && setActivePI(n)}
            disabled={!canSchedule}
            className="group bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 text-left hover:border-[#e8c97d44] hover:bg-[#1e1e35] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1a1a2e] disabled:hover:border-white/10"
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
