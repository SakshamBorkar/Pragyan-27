'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'
import { APP_NAME } from '@/lib/branding'
import { getApiUrl } from '@/lib/utils'

const RESEND_COOLDOWN_SEC = 60

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [notice, setNotice] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleSendOtp() {
    setError('')
    setNotice('')
    if (!email.trim()) {
      setError('Enter your email first.')
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send verification code.')
        return
      }
      setOtpSent(true)
      setCooldown(RESEND_COOLDOWN_SEC)
      if (data.devOtp) {
        setDevOtp(data.devOtp)
        setNotice(data.smtpError ?? data.message ?? 'Use this verification code:')
      } else {
        setDevOtp('')
        setNotice(data.message ?? 'Verification code sent. Check your email inbox (and spam).')
      }
    } catch {
      setError('Failed to send verification code.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!otpSent) {
      setError('Send and enter the verification code sent to your email.')
      return
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit verification code from your email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.')
        return
      }
      if (data.token) localStorage.setItem('pragyan_session', data.token)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
            ← Back to home
          </Link>
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="h-16 w-auto mx-auto mb-4 object-contain rounded-xl"
          />
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-gray-400 text-sm mt-1">Verify your email to register</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            We send a 6-digit code to your email to confirm it is valid before creating your account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    setOtpSent(false)
                    setOtp('')
                    setDevOtp('')
                  }}
                  placeholder="you@example.com"
                  required
                  className="flex-1 min-w-0 bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || cooldown > 0 || !email.trim()}
                  className="flex-shrink-0 text-xs border border-[#e8c97d44] text-[#e8c97d] rounded-lg px-3 py-2.5 hover:bg-[#e8c97d11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sendingOtp ? 'Sending…' : cooldown > 0 ? `${cooldown}s` : otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code from email"
                  required
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 tracking-[0.3em] focus:outline-none focus:border-[#e8c97d] transition-colors"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Check your inbox (and spam). Code expires in 10 minutes.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5" htmlFor="register-password">Password</label>
              <PasswordInput
                id="register-password"
                value={password}
                onChange={setPassword}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            {notice && !devOtp && <p className="text-emerald-400 text-xs">{notice}</p>}
            {devOtp && (
              <div className="rounded-xl bg-[#e8c97d11] border border-[#e8c97d44] px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">{notice}</p>
                <p className="text-2xl font-semibold tracking-[0.35em] text-[#e8c97d]">{devOtp}</p>
                <p className="text-[11px] text-gray-500 mt-2">
                  Add Gmail App Password to <span className="text-gray-400">SMTP_PASS</span> in .env.local to send real emails.
                </p>
              </div>
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#f0d898] transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Verify & Register'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-[#e8c97d] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
