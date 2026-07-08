import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { sendRegistrationOtp, isEmailConfigured } from '@/lib/email'
import {
  generateOtpCode,
  hashOtp,
  isValidEmail,
  MAX_SENDS_PER_WINDOW,
  normalizeEmail,
  otpExpiresAt,
  sendWindowStart,
} from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json() as { email?: string }

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const email = normalizeEmail(rawEmail)

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const windowStart = sendWindowStart()
    const { count, error: countError } = await supabase
      .from('email_otps')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', windowStart)

    if (countError) {
      console.error(countError)
      return NextResponse.json({ error: 'Failed to send verification code.' }, { status: 500 })
    }

    if ((count ?? 0) >= MAX_SENDS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Too many codes sent. Wait a few minutes and try again.' },
        { status: 429 },
      )
    }

    const code = generateOtpCode()
    const otpHash = await hashOtp(code)
    const expiresAt = otpExpiresAt()

    const { error: insertError } = await supabase.from('email_otps').insert({
      email,
      otp_hash: otpHash,
      expires_at: expiresAt,
    })

    if (insertError) {
      console.error(insertError)
      return NextResponse.json({ error: 'Failed to send verification code.' }, { status: 500 })
    }

    try {
      await sendRegistrationOtp(email, code)
    } catch (err) {
      console.error(err)
      const smtpErr = err as { code?: string; response?: string }
      const isAuthError = smtpErr.code === 'EAUTH'

      if (process.env.NODE_ENV === 'development' && isAuthError) {
        return NextResponse.json({
          ok: true,
          message: 'Gmail rejected the App Password — use the code below to continue testing.',
          devOtp: code,
          smtpError:
            'Invalid Gmail App Password. Create a new one at Google Account → Security → App passwords (not your normal Gmail password).',
        })
      }

      await supabase.from('email_otps').delete().eq('email', email).eq('otp_hash', otpHash)

      if (isAuthError) {
        return NextResponse.json(
          {
            error:
              'Gmail login failed. Use a Google App Password in SMTP_PASS (not your normal Gmail password).',
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        { error: 'Failed to send email. Check SMTP settings or try again later.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      message: isEmailConfigured()
        ? 'Verification code sent to your email.'
        : 'Verification code generated (email not configured).',
      devHint: !isEmailConfigured()
        ? 'Gmail SMTP is not set up — use the code shown below to continue.'
        : undefined,
      devOtp: process.env.NODE_ENV === 'development' && !isEmailConfigured() ? code : undefined,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
