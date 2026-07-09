'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from './AppShell'
import {
  formatAllottedDate,
  formatWeekday,
  toDateKey,
  type AllotmentUser,
} from '@/lib/types'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  userName: string
  isAdmin?: boolean
  currentUserId: number
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function AllotmentsClient({ userName, isAdmin = false, currentUserId }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [assignments, setAssignments] = useState<Record<string, AllotmentUser[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAllotments() {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(getApiUrl(`/api/assignments/allotments?year=${viewYear}&month=${viewMonth}`))
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to load allotments.')
        return
      }
      setAssignments(data.assignments ?? {})
    } catch {
      setError('Failed to load allotments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllotments()
  }, [viewYear, viewMonth])

  const sortedDates = useMemo(
    () => Object.keys(assignments).sort(),
    [assignments],
  )

  const totalAllotted = useMemo(
    () => sortedDates.reduce((sum, date) => sum + assignments[date].length, 0),
    [assignments, sortedDates],
  )

  function shiftMonth(delta: number) {
    let month = viewMonth + delta
    let year = viewYear
    if (month < 1) {
      month = 12
      year -= 1
    } else if (month > 12) {
      month = 1
      year += 1
    }
    setViewMonth(month)
    setViewYear(year)
  }

  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  return (
    <AppShell userName={userName} isAdmin={isAdmin}>
      <header className="mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Team schedule</p>
        <h1 className="text-2xl font-semibold">Allotments</h1>
        <p className="text-sm text-gray-400 mt-1">
          See who is allotted to schedule PI on each day.
        </p>
      </header>

      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => shiftMonth(-1)}
          className="text-sm text-gray-400 border border-white/10 rounded-lg px-3 py-2 hover:text-white hover:border-white/20 transition-colors"
        >
          ← Prev
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold">{MONTHS[viewMonth - 1]} {viewYear}</p>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {sortedDates.length} day{sortedDates.length === 1 ? '' : 's'} · {totalAllotted} allotment{totalAllotted === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <button
          onClick={() => shiftMonth(1)}
          className="text-sm text-gray-400 border border-white/10 rounded-lg px-3 py-2 hover:text-white hover:border-white/20 transition-colors"
        >
          Next →
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center text-sm text-gray-500">
          Loading allotments…
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400">No allotments for this month.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const users = assignments[date]
            const isPast = date < todayKey
            const completedCount = users.filter(u => u.completed).length

            return (
              <div
                key={date}
                className={`bg-[#1a1a2e] border rounded-2xl p-5 ${
                  isPast ? 'border-white/5 opacity-80' : 'border-[#e8c97d33]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-base font-semibold text-white">{formatAllottedDate(date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatWeekday(date)}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border bg-[#e8c97d11] text-[#e8c97d] border-[#e8c97d44]">
                    {users.length} allotted
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${
                        user.id === currentUserId
                          ? 'bg-[#e8c97d11] border-[#e8c97d44]'
                          : 'bg-[#0f0f1a] border-white/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.name}
                          {user.id === currentUserId && (
                            <span className="text-[10px] text-[#e8c97d] ml-2">You</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 border ${
                          user.completed
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {user.completed
                          ? user.completedPiNumber
                            ? `PI-${user.completedPiNumber} done`
                            : 'Done'
                          : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>

                {completedCount > 0 && (
                  <p className="text-xs text-gray-500 mt-3">
                    {completedCount}/{users.length} completed scheduling
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
