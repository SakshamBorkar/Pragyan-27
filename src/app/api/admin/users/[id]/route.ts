import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const userId = Number(params.id)
  if (!userId) return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 })

  if (userId === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  const { error } = await supabase.from('users').delete().eq('id', userId)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
