import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/db'
import { signToken, COOKIE_NAME, normalizeRole } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, loginAs } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
    }

    if (loginAs !== 'user' && loginAs !== 'admin') {
      return NextResponse.json({ error: 'Choose to login as User or Admin.' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const role = normalizeRole(user.role)

    if (loginAs === 'admin' && role !== 'admin') {
      return NextResponse.json({ error: 'This account is not an admin.' }, { status: 403 })
    }

    const token = await signToken({ userId: user.id, name: user.name, email: user.email, role })

    const res = NextResponse.json({
      user: { name: user.name, email: user.email, role },
      loginAs,
      redirectTo: loginAs === 'admin' ? '/admin' : '/dashboard',
    })
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
