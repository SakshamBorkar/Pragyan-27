'use client'

import { useEffect, useState } from 'react'

import { formatAllottedDate } from '@/lib/types'
import { APP_NAME } from '@/lib/branding'
import { authFetch, getApiUrl } from '@/lib/utils'

interface Props {
  piNumber: 1 | 2
  onBack?: () => void
  assignedDates?: string[]
  restrictToAssignedDates?: boolean
  embedded?: boolean
  defaultPhone?: string
  defaultRowIndex?: number
}

const SPARKLES = '\u2728'
const ROCKET = '\u{1F680}'

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, '')
}

function buildWhatsAppUrl(phone: string, text: string): string {
  const normalized = text.normalize('NFC')
  const cleanPhone = normalizePhone(phone)

  if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isCapacitor = (window as any).Capacitor

    if (isMobile || isCapacitor) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(normalized)}`
    }
  }

  // Web app (desktop) -> use WhatsApp Web link directly
  return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(normalized)}`
}

function formatDate(d: string): string {
  if (!d) return '[Date]'
  const [y, m, day] = d.split('-')
  const formatted = `${day}/${m}/${y}`

  const selected = new Date(`${d}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  selected.setHours(0, 0, 0, 0)

  let suffix = ''
  if (selected.getTime() === today.getTime()) suffix = '(Today)'
  else if (selected.getTime() === tomorrow.getTime()) suffix = '(Tomorrow)'

  return `${formatted}${suffix}`
}

function formatTime(t: string): string {
  if (!t) return '[Time]'
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  const h12 = hr % 12 || 12
  return `${String(h12).padStart(2, '0')}:${m} ${ampm}`
}

function buildMessage(piNumber: number, date: string, time: string, venue: string): string {
  return `Greetings from ${APP_NAME} Team ${SPARKLES}${SPARKLES}${SPARKLES}

Your PI-${piNumber} will be conducted on:
Date:${formatDate(date)}
Time: ${formatTime(time)}
Venue: ${venue || '[Venue]'}

Please be available 10 min prior to the scheduled time. 

Do visit the Pragyan's website and social media handles to get a head start and learn more about Pragyan and our team. 

Do acknowledge with a ${ROCKET} to confirm your PI slot`
}

export default function PIForm({
  piNumber,
  onBack,
  assignedDates = [],
  restrictToAssignedDates = false,
  embedded = false,
  defaultPhone = '',
  defaultRowIndex,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone)

  useEffect(() => {
    if (defaultPhone) {
      setPhone(defaultPhone)
    }
  }, [defaultPhone])
  const [date, setDate] = useState(restrictToAssignedDates && assignedDates.length === 1 ? assignedDates[0] : '')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const isPreviewReady = date && time && venue

  useEffect(() => {
    if (restrictToAssignedDates && assignedDates.length === 1) {
      setDate(assignedDates[0])
    }
  }, [assignedDates, restrictToAssignedDates])

  useEffect(() => {
    if (isPreviewReady) {
      setMessage(buildMessage(piNumber, date, time, venue))
    }
  }, [piNumber, date, time, venue, isPreviewReady])

  async function handleSend() {
    setError('')
    setNotice('')
    if (!phone.trim()) { setError('Enter recipient phone number.'); return }
    if (!date) { setError('Select a date.'); return }
    if (restrictToAssignedDates && !assignedDates.includes(date)) {
      setError('You can only schedule on dates assigned to you.')
      return
    }
    if (!time) { setError('Select a time.'); return }
    if (!venue.trim()) { setError('Enter venue.'); return }
    if (!message.trim()) { setError('Message cannot be empty.'); return }

    const normalized = message.normalize('NFC')

    try {
      await navigator.clipboard.writeText(normalized)
    } catch {
      // Clipboard may be blocked; WhatsApp Web URL still opens with the text.
    }

    const isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window as any).Capacitor
    )

    window.open(buildWhatsAppUrl(phone, normalized), '_blank', 'noopener,noreferrer')
    setNotice(
      isMobile
        ? 'Opened WhatsApp. Mark scheduling as completed in the panel on the right when done.'
        : 'Opened WhatsApp Web. Mark scheduling as completed in the panel on the right when done.'
    )

    try {
      await authFetch(getApiUrl('/api/inductions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: defaultRowIndex,
          phone,
          date,
          time,
          venue,
        }),
      })
    } catch (e) {
      console.error('Failed to sync slot details with Google Sheet:', e)
    }
  }

  const formCard = (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Recipient phone number <span className="text-gray-600">(with country code)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Allotted date</label>
          {restrictToAssignedDates ? (
            <select
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors"
            >
              <option value="">Select your allotted date</option>
              {assignedDates.map(d => (
                <option key={d} value={d}>{formatAllottedDate(d)}</option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors [color-scheme:dark]"
            />
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#e8c97d] transition-colors [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Venue</label>
          <input
            type="text"
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="e.g. LHC 03"
            className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
          />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Message (editable before sending)</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={14}
            placeholder="Fill in date, time, and venue to generate the message."
            className="w-full bg-[#0f0f1a] border border-white/5 rounded-xl p-4 text-xs text-gray-300 leading-relaxed resize-y focus:outline-none focus:border-[#e8c97d44] transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {notice && <p className="text-emerald-400 text-xs">{notice}</p>}

        <button
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20c05b] text-white font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Open in WhatsApp
        </button>
    </div>
  )

  if (embedded) return formCard

  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          ← Back
        </button>
      )}

      <h1 className="text-xl font-semibold mb-1">PI‑{piNumber} Scheduler</h1>
      <p className="text-sm text-gray-400 mb-6">
        Fill in the slot details — the WhatsApp message will be pre-filled for you.
      </p>

      {formCard}
    </div>
  )
}
