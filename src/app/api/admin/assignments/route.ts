import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/db'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

  const { data: assignments, error } = await supabase
    .from('pi_assignments')
    .select('id, user_id, assigned_date, users(id, name, email)')
    .gte('assigned_date', start)
    .lte('assigned_date', end)
    .order('assigned_date', { ascending: true })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load assignments.' }, { status: 500 })
  }

  const byDate: Record<string, { userIds: number[]; users: { id: number; name: string; email: string }[] }> = {}

  for (const row of assignments ?? []) {
    const date = row.assigned_date as string
    const user = row.users as { id: number; name: string; email: string } | null
    if (!user) continue
    if (!byDate[date]) byDate[date] = { userIds: [], users: [] }
    byDate[date].userIds.push(user.id)
    byDate[date].users.push(user)
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

  const uniqueIds = [...new Set(userIds.filter(id => Number.isInteger(id) && id > 0))]

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

  const { error: deleteError } = await supabase
    .from('pi_assignments')
    .delete()
    .eq('assigned_date', date)

  if (deleteError) {
    console.error(deleteError)
    return NextResponse.json({ error: 'Failed to update assignments.' }, { status: 500 })
  }

  if (uniqueIds.length > 0) {
    const rows = uniqueIds.map(userId => ({ user_id: userId, assigned_date: date }))
    const { error: insertError } = await supabase.from('pi_assignments').insert(rows)

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: 'Failed to save assignments.' }, { status: 500 })
    }
  }

  const { data: saved, error: fetchError } = await supabase
    .from('pi_assignments')
    .select('id, user_id, assigned_date, users(id, name, email)')
    .eq('assigned_date', date)

  if (fetchError) {
    console.error(fetchError)
    return NextResponse.json({ ok: true, date, userIds: uniqueIds, users: [] })
  }

  const users = (saved ?? [])
    .map(r => r.users as { id: number; name: string; email: string } | null)
    .filter(Boolean) as { id: number; name: string; email: string }[]

  return NextResponse.json({ date, userIds: uniqueIds, users })
}
