'use client'

import { formatAllottedDate, formatWeekday } from '@/lib/types'

interface Props {
  userName: string
  dates: string[]
  loading?: boolean
  compact?: boolean
}

export default function AssignedDatesPanel({
  userName,
  dates,
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

  if (dates.length === 0) {
    return (
      <div className={`bg-[#1a1a2e] border border-white/10 rounded-2xl ${compact ? 'p-4 mb-4' : 'p-5 mb-6'}`}>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">PI scheduling allotment</p>
        <p className="text-sm text-gray-400">
          Hi {userName.split(' ')[0]}, you are not allotted for any date yet. An admin will assign you on the schedule calendar.
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-[#1a1a2e] border border-[#e8c97d44] rounded-2xl ${compact ? 'p-4 mb-4' : 'p-5 mb-6'}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#e8c97d22] border border-[#e8c97d44] flex items-center justify-center text-[#e8c97d] flex-shrink-0">
          ✓
        </div>
        <div>
          <p className="text-xs text-[#e8c97d] uppercase tracking-widest mb-1">You are allotted</p>
          <p className="text-sm text-gray-300">
            Hi {userName.split(' ')[0]}, an admin has allotted you to schedule PI on{' '}
            {dates.length === 1 ? 'this date' : `these ${dates.length} dates`}:
          </p>
        </div>
      </div>

      <div className={`space-y-2 ${compact ? '' : ''}`}>
        {dates.map(date => (
          <div
            key={date}
            className="flex items-center justify-between bg-[#0f0f1a] border border-[#e8c97d33] rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{formatAllottedDate(date)}</p>
              {!compact && (
                <p className="text-xs text-gray-500 mt-0.5">{formatWeekday(date)}</p>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-[#e8c97d22] text-[#e8c97d] border border-[#e8c97d44] rounded-full px-2.5 py-1">
              Allotted
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
