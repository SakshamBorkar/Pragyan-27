import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/db'
import type { UserRole } from '@/lib/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 })
  }

  return NextResponse.json({ users })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { userId, role } = await req.json() as { userId?: number; role?: UserRole }

  if (!userId || (role !== 'user' && role !== 'admin')) {
    return NextResponse.json({ error: 'Valid userId and role required.' }, { status: 400 })
  }

  if (userId === session.userId && role !== 'admin') {
    return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 })
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select('id, name, email, role, created_at')
    .single()

  if (error || !user) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 })
  }

  return NextResponse.json({ user })
}
