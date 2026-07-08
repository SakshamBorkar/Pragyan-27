import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { toDateKey } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const today = new Date()
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate())

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
