import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().slice(0, 10)

  const { data: assignments, error } = await supabase
    .from('pi_assignments')
    .select('id, assigned_date')
    .eq('user_id', session.userId)
    .gte('assigned_date', todayKey)
    .order('assigned_date', { ascending: true })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load assignments.' }, { status: 500 })
  }

  const dates = (assignments ?? []).map(a => a.assigned_date as string)
  return NextResponse.json({ dates })
}
