'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LoginAs } from '@/lib/types'
import PasswordInput from '@/components/PasswordInput'
import { APP_NAME } from '@/lib/branding'
import { getApiUrl } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginAs, setLoginAs] = useState<LoginAs>('user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginAs }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (data.token) localStorage.setItem('pragyan_session', data.token)
      router.push(data.redirectTo ?? (loginAs === 'admin' ? '/admin' : '/dashboard'))
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const optionClass = (option: LoginAs) =>
    loginAs === option
      ? 'border-[#e8c97d] bg-[#e8c97d11] text-[#e8c97d]'
      : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
            ← Back to home
          </Link>
          <span className="inline-block bg-[#1a1a2e] border border-[#e8c97d33] text-[#e8c97d] px-5 py-2 rounded-full text-sm font-medium tracking-wide mb-4">
            ✨ {APP_NAME}
          </span>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to the PI scheduler</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Login as</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoginAs('user')}
                  className={`text-sm border rounded-lg py-2.5 transition-colors ${optionClass('user')}`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setLoginAs('admin')}
                  className={`text-sm border rounded-lg py-2.5 transition-colors ${optionClass('admin')}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#e8c97d] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5" htmlFor="login-password">Password</label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={setPassword}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#f0d898] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : loginAs === 'admin' ? 'Sign in as Admin' : 'Sign in as User'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-4">
            No account?{' '}
            <Link href="/register" className="text-[#e8c97d] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
