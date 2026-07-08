import { NextRequest, NextResponse } from 'next/server'
import { fetchAdminLookup, mapAssigner, resolveAssigner } from '@/lib/assignments'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { toDateKey, type UserAssignment } from '@/lib/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const ASSIGNMENT_SELECT = `
  assigned_date,
  created_at,
  completed_at,
  completed_pi_number,
  assigned_by,
  assigner:users!assigned_by(id, name, email)
`

type AssignmentRow = {
  assigned_date: string
  created_at: string
  completed_at: string | null
  completed_pi_number: number | null
  assigned_by: number | null
  assigner: unknown
}

function mapAssignment(row: AssignmentRow, adminLookup: Map<number, { id: number; name: string; email: string }>): UserAssignment {
  return {
    date: row.assigned_date,
    completed: Boolean(row.completed_at),
    completedAt: row.completed_at,
    completedPiNumber: row.completed_pi_number === 1 || row.completed_pi_number === 2
      ? row.completed_pi_number
      : null,
    allottedAt: row.created_at,
    allottedBy: resolveAssigner(row.assigner, row.assigned_by, adminLookup),
  }
}

async function loadAssignmentsForUser(userId: number, todayKey: string) {
  const { data: rows, error } = await supabase
    .from('pi_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('user_id', userId)
    .gte('assigned_date', todayKey)
    .order('assigned_date', { ascending: true })

  if (error) throw error

  const typedRows = (rows ?? []) as AssignmentRow[]
  const missingAdminIds = [
    ...new Set(
      typedRows
        .filter(r => !mapAssigner(r.assigner) && r.assigned_by != null)
        .map(r => Number(r.assigned_by))
        .filter(Number.isFinite),
    ),
  ]

  const adminLookup = await fetchAdminLookup(supabase, missingAdminIds)
  return typedRows.map(r => mapAssignment(r, adminLookup))
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const today = new Date()
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  let assignments: UserAssignment[]
  try {
    assignments = await loadAssignmentsForUser(session.userId, todayKey)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load assignments.' }, { status: 500 })
  }
  const dates = assignments.map(a => a.date)
  return NextResponse.json({ dates, assignments })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { date, piNumber } = await req.json() as { date?: string; piNumber?: number }

  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Valid date required.' }, { status: 400 })
  }
  if (piNumber !== 1 && piNumber !== 2) {
    return NextResponse.json({ error: 'Valid PI number (1 or 2) required.' }, { status: 400 })
  }

  const { data: row, error: findError } = await supabase
    .from('pi_assignments')
    .select('id')
    .eq('user_id', session.userId)
    .eq('assigned_date', date)
    .maybeSingle()

  if (findError) {
    console.error(findError)
    return NextResponse.json({ error: 'Failed to verify assignment.' }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: 'You are not allotted for this date.' }, { status: 403 })
  }

  const completedAt = new Date().toISOString()
  const { error } = await supabase
    .from('pi_assignments')
    .update({ completed_at: completedAt, completed_pi_number: piNumber })
    .eq('id', row.id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to mark scheduling as completed.' }, { status: 500 })
  }

  const today = new Date()
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

  let assignment: UserAssignment | undefined
  try {
    const assignments = await loadAssignmentsForUser(session.userId, todayKey)
    assignment = assignments.find(a => a.date === date)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to mark scheduling as completed.' }, { status: 500 })
  }

  return NextResponse.json({ assignment })
}
