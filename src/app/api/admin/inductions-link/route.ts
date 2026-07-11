import { NextRequest, NextResponse } from 'next/server'
import { getSession, isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'induction_sheet_link')
    .maybeSingle()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 })
  }

  return NextResponse.json({ link: data?.value || '' })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { link } = (await req.json()) as { link?: string }

  if (link === undefined) {
    return NextResponse.json({ error: 'Link is required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('settings')
    .upsert({
      key: 'induction_sheet_link',
      value: link.trim(),
      updated_at: new Date().toISOString(),
      updated_by: session.userId,
    })

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
