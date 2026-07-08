import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/db'
import { signToken, COOKIE_NAME, normalizeRole } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role: requestedRole } = body

    if (requestedRole === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be created via registration.' }, { status: 403 })
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email: email.toLowerCase(), password: hashed, role: 'user' })
      .select('id, name, email, role')
      .single()

    if (error || !user) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    const role = normalizeRole(user.role)
    const token = await signToken({ userId: user.id, name: user.name, email: user.email, role })

    const res = NextResponse.json({ user: { name: user.name, email: user.email, role } })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
