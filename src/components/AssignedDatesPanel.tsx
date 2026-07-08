'use client'

import { formatAllottedByLabel } from '@/lib/assignments'
import { formatAllottedDate, formatDateTime, formatWeekday, type UserAssignment } from '@/lib/types'

interface Props {
  userName: string
  assignments: UserAssignment[]
  loading?: boolean
  compact?: boolean
}

export default function AssignedDatesPanel({
  userName,
  assignments,
  loading = false,
  compact = false,
}: Props) {
  if (loading) {
    return (
      <div className={`bg-[#1a1a2e] border border-white/10 rounded-2xl ${compact ? 'p-4 mb-4' : 'p-5 mb-6'}`}>
        <p className="text-sm text-gray-500">Loading your allotment…</p>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className={`bg-[#1a1a2e] border border-white/10 rounded-2xl ${compact ? 'p-4 mb-4' : 'p-5 mb-6'}`}>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">PI scheduling allotment</p>
        <p className="text-sm text-gray-400">
          Hi {userName.split(' ')[0]}, you are not allotted for any date yet. An admin will assign you on the schedule calendar.
        </p>
      </div>
    )
  }

  const allCompleted = assignments.every(a => a.completed)

  return (
    <div className={`bg-[#1a1a2e] border border-[#e8c97d44] rounded-2xl ${compact ? 'p-4 mb-4' : 'p-5 mb-6'}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#e8c97d22] border border-[#e8c97d44] flex items-center justify-center text-[#e8c97d] flex-shrink-0">
          {allCompleted ? '✓' : '◷'}
        </div>
        <div>
          <p className="text-xs text-[#e8c97d] uppercase tracking-widest mb-1">You are allotted</p>
          <p className="text-sm text-gray-300">
            Hi {userName.split(' ')[0]}, you have been allotted to schedule PI on{' '}
            {assignments.length === 1 ? 'this date' : `these ${assignments.length} dates`}:
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {assignments.map(item => (
          <div
            key={item.date}
            className={`rounded-xl px-4 py-3 ${
              item.completed
                ? 'bg-emerald-950/40 border border-emerald-500/30'
                : 'bg-[#0f0f1a] border border-[#e8c97d33]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{formatAllottedDate(item.date)}</p>
                {!compact && (
                  <p className="text-xs text-gray-500 mt-0.5">{formatWeekday(item.date)}</p>
                )}
              </div>
              <span
                className={`flex-shrink-0 text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border ${
                  item.completed
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#e8c97d22] text-[#e8c97d] border-[#e8c97d44]'
                }`}
              >
                {item.completed ? 'Completed' : 'Allotted'}
              </span>
            </div>

            <div className={`mt-3 space-y-1 ${compact ? 'text-[11px]' : 'text-xs'} text-gray-400`}>
              <p>
                <span className="text-gray-300">{formatAllottedByLabel(item.allottedBy?.name)}</span>
              </p>
              <p>
                <span className="text-gray-500">Allotted on:</span>{' '}
                <span className="text-gray-300">{formatDateTime(item.allottedAt)}</span>
              </p>
              {item.completed && (
                <>
                  <p>
                    <span className="text-gray-500">Completed on:</span>{' '}
                    <span className="text-emerald-400">{formatDateTime(item.completedAt)}</span>
                  </p>
                  {item.completedPiNumber && (
                    <p>
                      <span className="text-gray-500">PI round:</span>{' '}
                      <span className="text-emerald-400">PI-{item.completedPiNumber}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
