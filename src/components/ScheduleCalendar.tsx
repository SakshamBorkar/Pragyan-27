'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AssignedUserStatus, UserRecord } from '@/lib/types'
import { formatDisplayDate, toDateKey, formatDateTime } from '@/lib/types'
import { authFetch, getApiUrl } from '@/lib/utils'

interface DayAssignments {
  userIds: number[]
  users: AssignedUserStatus[]
  completedCount: number
}

interface Props {
  users: UserRecord[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function ScheduleCalendar({ users }: Props) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [assignments, setAssignments] = useState<Record<string, DayAssignments>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const schedulableUsers = useMemo(
    () => users.filter(u => u.role === 'user'),
    [users]
  )

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
    const cells: Array<{ day: number; dateKey: string } | null> = []

    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, dateKey: toDateKey(viewYear, viewMonth, day) })
    }
    return cells
  }, [viewYear, viewMonth])

  async function loadAssignments() {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(getApiUrl(`/api/admin/assignments?year=${viewYear}&month=${viewMonth}`))
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to load schedule.')
        return
      }
      setAssignments(data.assignments ?? {})
    } catch {
      setError('Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [viewYear, viewMonth])

  function openDate(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedUserIds(assignments[dateKey]?.userIds ?? [])
    setNotice('')
    setError('')
  }

  function closeModal() {
    setSelectedDate(null)
    setSelectedUserIds([])
  }

  function toggleUser(userId: number) {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  async function saveAssignments() {
    if (!selectedDate) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await authFetch(getApiUrl('/api/admin/assignments'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, userIds: selectedUserIds }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save assignments.')
        return
      }
      setAssignments(prev => ({
        ...prev,
        [selectedDate]: {
          userIds: data.userIds,
          users: data.users,
          completedCount: data.completedCount ?? 0,
        },
      }))
      setNotice(`Saved assignments for ${formatDisplayDate(selectedDate)}.`)
    } catch {
      setError('Failed to save assignments.')
    } finally {
      setSaving(false)
    }
  }

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth() + 1)
    closeModal()
  }

  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  return (
    <div>
      <p className="text-gray-400 text-sm mb-6">
        Click a date to assign team members who can schedule PI slots on that day.
      </p>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-3 sm:p-5">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => shiftMonth(-1)}
            className="text-xs sm:text-sm text-gray-400 hover:text-white px-2.5 py-1.5 border border-white/10 rounded-lg"
          >
            ← Prev
          </button>
          <h2 className="text-xs sm:text-sm font-semibold">
            {MONTHS[viewMonth - 1]} {viewYear}
          </h2>
          <button
            onClick={() => shiftMonth(1)}
            className="text-xs sm:text-sm text-gray-400 hover:text-white px-2.5 py-1.5 border border-white/10 rounded-lg"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading calendar…</p>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} />
              const dayData = assignments[cell.dateKey]
              const count = dayData?.userIds.length ?? 0
              const done = dayData?.completedCount ?? 0
              const isToday = cell.dateKey === todayKey
              const isSelected = cell.dateKey === selectedDate

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => openDate(cell.dateKey)}
                  className={`min-h-[48px] sm:min-h-[72px] rounded-lg sm:rounded-xl border p-1 sm:p-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#e8c97d] bg-[#e8c97d11]'
                      : isToday
                        ? 'border-[#e8c97d44] bg-[#1e1e35]'
                        : 'border-white/10 hover:border-white/20 hover:bg-[#1e1e35]'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium">{cell.day}</div>
                  {count > 0 && (
                    <div className="mt-1 sm:mt-2 flex flex-col gap-1">
                      <span className="inline-block text-[9px] sm:text-[10px] bg-[#e8c97d22] text-[#e8c97d] border border-[#e8c97d44] rounded-full px-1 sm:px-2 py-0.5 text-center min-w-[18px] w-fit">
                        {count}<span className="hidden sm:inline"> user{count !== 1 ? 's' : ''}</span>
                      </span>
                      {done > 0 && (
                        <span className="inline-block text-[9px] sm:text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-1 sm:px-2 py-0.5 w-fit text-center min-w-[18px]">
                          {done}<span className="hidden sm:inline">/{count} done</span>
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Assign for</p>
                <h3 className="text-lg font-semibold">{formatDisplayDate(selectedDate)}</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {schedulableUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No regular users available to assign.</p>
            ) : (
              <>
                {selectedDate && assignments[selectedDate] && assignments[selectedDate].users.some(u => selectedUserIds.includes(u.id)) && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Assignment details</p>
                    {assignments[selectedDate].users
                      .filter(u => selectedUserIds.includes(u.id))
                      .map(user => (
                        <div
                          key={user.id}
                          className={`rounded-xl px-3 py-3 text-xs ${
                            user.completed
                              ? 'bg-emerald-500/10 border border-emerald-500/30'
                              : 'bg-[#0f0f1a] border border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{user.name}</span>
                            <span className={user.completed ? 'text-emerald-400' : 'text-gray-400'}>
                              {user.completed
                                ? `Completed${user.completedPiNumber ? ` · PI-${user.completedPiNumber}` : ''}`
                                : 'Pending'}
                            </span>
                          </div>
                          <div className="space-y-1 text-gray-500">
                            <p>Allotted by: <span className="text-gray-300">{user.allottedBy?.name ?? '—'}</span></p>
                            <p>Allotted on: <span className="text-gray-300">{formatDateTime(user.allottedAt)}</span></p>
                            {user.completed && (
                              <p>Completed on: <span className="text-emerald-400">{formatDateTime(user.completedAt)}</span></p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {schedulableUsers.map(user => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:border-[#e8c97d44]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="accent-[#e8c97d]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      {assignments[selectedDate]?.users.find(u => u.id === user.id)?.completed && (
                        <span className="text-[10px] text-emerald-400">Done</span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            {notice && <p className="text-emerald-400 text-xs mb-3">{notice}</p>}

            <div className="flex gap-3">
              <button
                onClick={saveAssignments}
                disabled={saving}
                className="flex-1 bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#f0d898] disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save assignments'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 text-sm text-gray-400 border border-white/10 rounded-lg hover:border-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
