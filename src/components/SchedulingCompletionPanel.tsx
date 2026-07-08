'use client'

import { useState } from 'react'
import { formatAllottedDate, formatDateTime, type UserAssignment } from '@/lib/types'

interface Props {
  assignments: UserAssignment[]
  onCompleted: () => void
  loading?: boolean
  defaultPiNumber?: 1 | 2
}

export default function SchedulingCompletionPanel({
  assignments,
  onCompleted,
  loading = false,
  defaultPiNumber = 1,
}: Props) {
  const [selectedDate, setSelectedDate] = useState('')
  const [piNumber, setPiNumber] = useState<1 | 2>(defaultPiNumber)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const pending = assignments.filter(a => !a.completed)
  const completed = assignments.filter(a => a.completed)

  async function handleMarkCompleted() {
    if (!selectedDate) {
      setError('Select an allotted date.')
      return
    }

    setCompleting(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/assignments/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, piNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to mark as completed.')
        return
      }
      setNotice('Scheduling marked as completed.')
      setSelectedDate('')
      onCompleted()
    } catch {
      setError('Failed to mark as completed.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <aside className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 h-fit w-full lg:max-w-[320px] lg:justify-self-end">
        <p className="text-sm text-gray-500">Loading…</p>
      </aside>
    )
  }

  if (assignments.length === 0) {
    return (
      <aside className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 h-fit w-full lg:max-w-[320px] lg:justify-self-end">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Scheduling status</p>
        <p className="text-sm text-gray-400">No allotted dates yet.</p>
      </aside>
    )
  }

  return (
    <aside className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 h-fit w-full lg:max-w-[320px] lg:justify-self-end">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Scheduling status</p>
      <h2 className="text-sm font-semibold mb-4">Mark task as completed</h2>
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
        After you finish sending WhatsApp messages for an allotted date, mark it complete here — not per message.
      </p>

      {pending.length > 0 ? (
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Allotted date</label>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors"
            >
              <option value="">Select date</option>
              {pending.map(a => (
                <option key={a.date} value={a.date}>{formatAllottedDate(a.date)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">PI round completed</label>
            <div className="grid grid-cols-2 gap-2">
              {([1, 2] as const).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPiNumber(n)}
                  className={`text-sm border rounded-lg py-2 transition-colors ${
                    piNumber === n
                      ? 'border-[#e8c97d] bg-[#e8c97d11] text-[#e8c97d]'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  PI-{n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleMarkCompleted}
            disabled={completing || !selectedDate}
            className="w-full bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#f0d898] transition-colors disabled:opacity-50"
          >
            {completing ? 'Saving…' : 'Mark scheduling as completed'}
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          ✓ All allotted dates completed
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      {notice && <p className="text-emerald-400 text-xs mb-3">{notice}</p>}

      {completed.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Completed</p>
          <div className="space-y-2">
            {completed.map(item => (
              <div
                key={item.date}
                className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 px-3 py-2.5 text-xs"
              >
                <p className="font-medium text-emerald-400">{formatAllottedDate(item.date)}</p>
                {item.completedPiNumber && (
                  <p className="text-gray-400 mt-0.5">PI-{item.completedPiNumber}</p>
                )}
                <p className="text-gray-500 mt-1">{formatDateTime(item.completedAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
