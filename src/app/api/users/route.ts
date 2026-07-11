import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Failed to load user names list:', error)
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }

  const names = users.map(u => u.name)
  return NextResponse.json({ names })
}
