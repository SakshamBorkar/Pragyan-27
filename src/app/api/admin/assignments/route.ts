import { NextRequest, NextResponse } from 'next/server'
import { fetchAdminLookup, mapAssigner, resolveAssigner } from '@/lib/assignments'
import { getSession, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/db'
import type { AdminSummary, AssignedUserStatus } from '@/lib/types'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const ASSIGNMENT_SELECT = `
  id,
  user_id,
  assigned_date,
  created_at,
  completed_at,
  completed_pi_number,
  assigned_by,
  users!user_id(id, name, email),
  assigner:users!assigned_by(id, name, email)
`


type AssignmentRow = {
  id: number
  user_id: number
  assigned_date: string
  created_at: string
  completed_at: string | null
  completed_pi_number: number | null
  assigned_by: number | null
  users: unknown
  assigner: unknown
}

function mapUserStatus(row: AssignmentRow, adminLookup: Map<number, AdminSummary>): AssignedUserStatus | null {
  const user = row.users as { id: number; name: string; email: string } | null
  if (!user) return null

  const userId = typeof user.id === 'number' ? user.id : Number(user.id)

  return {
    id: userId,
    name: user.name,
    email: user.email,
    completed: Boolean(row.completed_at),
    completedAt: row.completed_at,
    completedPiNumber: row.completed_pi_number === 1 || row.completed_pi_number === 2
      ? row.completed_pi_number
      : null,
    allottedAt: row.created_at,
    allottedBy: resolveAssigner(row.assigner, row.assigned_by, adminLookup),
  }
}

async function loadMonthAssignments(start: string, end: string) {
  const { data: assignments, error } = await supabase
    .from('pi_assignments')
    .select(ASSIGNMENT_SELECT)
    .gte('assigned_date', start)
    .lte('assigned_date', end)
    .order('assigned_date', { ascending: true })

  if (error) throw error

  const rows = (assignments ?? []) as AssignmentRow[]
  const missingAdminIds = Array.from(new Set(
    rows
      .filter(r => !mapAssigner(r.assigner) && r.assigned_by != null)
      .map(r => Number(r.assigned_by))
      .filter(Number.isFinite),
  ))

  const adminLookup = await fetchAdminLookup(supabase, missingAdminIds)
  return { rows, adminLookup }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const year = Number(req.nextUrl.searchParams.get('year'))
  const month = Number(req.nextUrl.searchParams.get('month'))

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Valid year and month required.' }, { status: 400 })
  }

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  let rows: AssignmentRow[]
  let adminLookup: Map<number, AdminSummary>
  try {
    ;({ rows, adminLookup } = await loadMonthAssignments(start, end))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load assignments.' }, { status: 500 })
  }

  const byDate: Record<string, {
    userIds: number[]
    users: AssignedUserStatus[]
    completedCount: number
  }> = {}

  for (const row of rows) {
    const date = row.assigned_date
    const status = mapUserStatus(row, adminLookup)
    if (!status) continue

    if (!byDate[date]) byDate[date] = { userIds: [], users: [], completedCount: 0 }
    byDate[date].userIds.push(status.id)
    byDate[date].users.push(status)
    if (status.completed) byDate[date].completedCount++
  }

  return NextResponse.json({ assignments: byDate })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { date, userIds } = await req.json() as { date?: string; userIds?: number[] }

  if (!date || !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) required.' }, { status: 400 })
  }
  if (!Array.isArray(userIds)) {
    return NextResponse.json({ error: 'userIds array required.' }, { status: 400 })
  }

  const uniqueIds = Array.from(new Set(userIds.filter(id => Number.isInteger(id) && id > 0)))

  if (uniqueIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .in('id', uniqueIds)
      .eq('role', 'user')

    if (usersError) {
      console.error(usersError)
      return NextResponse.json({ error: 'Failed to validate users.' }, { status: 500 })
    }

    if ((users?.length ?? 0) !== uniqueIds.length) {
      return NextResponse.json({ error: 'Only regular users can be assigned.' }, { status: 400 })
    }
  }

  const { data: existingRows } = await supabase
    .from('pi_assignments')
    .select('user_id, completed_at, completed_pi_number, assigned_by, created_at')
    .eq('assigned_date', date)

  const existingMap = new Map(
    (existingRows ?? []).map(r => [r.user_id as number, r])
  )

  const { error: deleteError } = await supabase
    .from('pi_assignments')
    .delete()
    .eq('assigned_date', date)

  if (deleteError) {
    console.error(deleteError)
    return NextResponse.json({ error: 'Failed to update assignments.' }, { status: 500 })
  }

  if (uniqueIds.length > 0) {
    const rows = uniqueIds.map(userId => {
      const prev = existingMap.get(userId)
      return {
        user_id: userId,
        assigned_date: date,
        assigned_by: (prev?.assigned_by as number | null) ?? session.userId,
        completed_at: (prev?.completed_at as string | null) ?? null,
        completed_pi_number: (prev?.completed_pi_number as number | null) ?? null,
        ...(prev?.created_at ? { created_at: prev.created_at as string } : {}),
      }
    })

    const { error: insertError } = await supabase.from('pi_assignments').insert(rows)

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: 'Failed to save assignments.' }, { status: 500 })
    }
  }

  const { data: saved, error: fetchError } = await supabase
    .from('pi_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('assigned_date', date)

  if (fetchError) {
    console.error(fetchError)
    return NextResponse.json({ ok: true, date, userIds: uniqueIds, users: [], completedCount: 0 })
  }

  const savedRows = (saved ?? []) as AssignmentRow[]
  const missingAdminIds = Array.from(new Set(
    savedRows
      .filter(r => !mapAssigner(r.assigner) && r.assigned_by != null)
      .map(r => Number(r.assigned_by))
      .filter(Number.isFinite),
  ))
  const adminLookup = await fetchAdminLookup(supabase, missingAdminIds)

  const users = savedRows
    .map(r => mapUserStatus(r, adminLookup))
    .filter(Boolean) as AssignedUserStatus[]

  return NextResponse.json({
    date,
    userIds: uniqueIds,
    users,
    completedCount: users.filter(u => u.completed).length,
  })
}
