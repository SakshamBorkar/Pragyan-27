import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'
import type { AllotmentUser } from '@/lib/types'

const ASSIGNMENT_SELECT = `
  assigned_date,
  completed_at,
  completed_pi_number,
  users!user_id(id, name)
`

type Row = {
  assigned_date: string
  completed_at: string | null
  completed_pi_number: number | null
  users: unknown
}

function mapUser(raw: unknown): AllotmentUser | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Record<string, unknown>
  const id = typeof u.id === 'number' ? u.id : Number(u.id)
  if (!Number.isFinite(id) || typeof u.name !== 'string') return null

  return {
    id,
    name: u.name,
    completed: false,
    completedPiNumber: null,
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const year = Number(req.nextUrl.searchParams.get('year'))
  const month = Number(req.nextUrl.searchParams.get('month'))

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Valid year and month required.' }, { status: 400 })
  }

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  const { data: rows, error } = await supabase
    .from('pi_assignments')
    .select(ASSIGNMENT_SELECT)
    .gte('assigned_date', start)
    .lte('assigned_date', end)
    .order('assigned_date', { ascending: true })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load allotments.' }, { status: 500 })
  }

  const byDate: Record<string, AllotmentUser[]> = {}

  for (const row of (rows ?? []) as Row[]) {
    const user = mapUser(row.users)
    if (!user) continue

    user.completed = Boolean(row.completed_at)
    user.completedPiNumber = row.completed_pi_number === 1 || row.completed_pi_number === 2
      ? row.completed_pi_number
      : null

    const date = row.assigned_date
    if (!byDate[date]) byDate[date] = []
    byDate[date].push(user)
  }

  for (const date of Object.keys(byDate)) {
    byDate[date].sort((a, b) => a.name.localeCompare(b.name))
  }

  return NextResponse.json({ assignments: byDate, year, month })
}
