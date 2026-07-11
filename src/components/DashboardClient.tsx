'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from './AppShell'
import PIForm from './PIForm'
import AssignedDatesPanel from './AssignedDatesPanel'
import SchedulingCompletionPanel from './SchedulingCompletionPanel'
import type { UserAssignment } from '@/lib/types'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  userName: string
  isAdmin?: boolean
}

export default function DashboardClient({ userName, isAdmin = false }: Props) {
  const searchParams = useSearchParams()
  const phoneParam = searchParams.get('phone') || ''
  const piParam = searchParams.get('pi')
  const rowParam = searchParams.get('row') || ''

  const [activePI, setActivePI] = useState<1 | 2 | null>(() => {
    if (piParam === '1') return 1
    if (piParam === '2') return 2
    return null
  })
  const [assignments, setAssignments] = useState<UserAssignment[]>([])
  const [loadingDates, setLoadingDates] = useState(!isAdmin)

  const loadAssignments = useCallback(async () => {
    if (isAdmin) return
    setLoadingDates(true)
    try {
      const res = await authFetch(getApiUrl('/api/assignments/me'))
      const data = await res.json()
      if (res.ok) setAssignments(data.assignments ?? [])
    } finally {
      setLoadingDates(false)
    }
  }, [isAdmin])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  const assignedDates = assignments.map(a => a.date)
  const pendingDates = assignments.filter(a => !a.completed).map(a => a.date)
  const canSchedule = isAdmin || pendingDates.length > 0

  const completionSidebar = !isAdmin && (
    <SchedulingCompletionPanel
      assignments={assignments}
      onCompleted={loadAssignments}
      loading={loadingDates}
      defaultPiNumber={activePI ?? 1}
    />
  )

  if (activePI) {
    return (
      <AppShell userName={userName} isAdmin={isAdmin}>
        <button
          onClick={() => setActivePI(null)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4"
        >
          ← Back
        </button>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">PI‑{activePI} Scheduler</h1>
          <p className="text-sm text-gray-400">
            Fill in the slot details — the WhatsApp message will be pre-filled for you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 items-start">
          <PIForm
            piNumber={activePI}
            assignedDates={isAdmin ? undefined : assignedDates}
            restrictToAssignedDates={!isAdmin}
            embedded
            defaultPhone={phoneParam}
            defaultRowIndex={rowParam ? parseInt(rowParam, 10) : undefined}
          />
          {completionSidebar}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell userName={userName} isAdmin={isAdmin}>
      {!isAdmin && (
        <header className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-2xl font-semibold">User Panel</h1>
        </header>
      )}

      {isAdmin && (
        <header className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Scheduler</p>
          <h1 className="text-2xl font-semibold">PI Scheduler</h1>
        </header>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {!isAdmin && (
            <AssignedDatesPanel
              userName={userName}
              assignments={assignments}
              loading={loadingDates}
            />
          )}

          <p className="text-gray-400 text-sm">
            {canSchedule
              ? pendingDates.length > 0
                ? 'Pick a PI round to send WhatsApp messages. Mark completion in the panel on the right when done.'
                : 'Select the interview round to send a slot confirmation.'
              : assignments.length > 0
                ? 'All allotted dates are marked as completed. Great work!'
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

        {completionSidebar}
      </div>
    </AppShell>
  )
}
