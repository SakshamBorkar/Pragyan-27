import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/db'
import { signToken, COOKIE_NAME, normalizeRole } from '@/lib/auth'
import { isValidEmail, isOtpExpired, normalizeEmail, verifyOtpCode } from '@/lib/otp'

async function verifyEmailOtp(email: string, otp: string): Promise<boolean> {
  const { data: rows, error } = await supabase
    .from('email_otps')
    .select('id, otp_hash, expires_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error(error)
    return false
  }

  for (const row of rows ?? []) {
    if (isOtpExpired(row.expires_at as string)) continue
    const valid = await verifyOtpCode(otp, row.otp_hash as string)
    if (valid) {
      await supabase.from('email_otps').delete().eq('email', email)
      return true
    }
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email: rawEmail, password, otp, role: requestedRole } = body

    if (requestedRole === 'admin') {
      return NextResponse.json({ error: 'Admin accounts cannot be created via registration.' }, { status: 403 })
    }

    if (!name || !rawEmail || !password || !otp) {
      return NextResponse.json({ error: 'All fields including verification code are required.' }, { status: 400 })
    }

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const email = normalizeEmail(rawEmail)

    if (!/^\d{6}$/.test(String(otp).trim())) {
      return NextResponse.json({ error: 'Enter the 6-digit verification code from your email.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const otpValid = await verifyEmailOtp(email, String(otp).trim())
    if (!otpValid) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed, role: 'user' })
      .select('id, name, email, role')
      .single()

    if (error || !user) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    const role = normalizeRole(user.role)
    const token = await signToken({ userId: user.id, name: user.name, email: user.email, role })

    const res = NextResponse.json({ token, user: { name: user.name, email: user.email, role } })
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
