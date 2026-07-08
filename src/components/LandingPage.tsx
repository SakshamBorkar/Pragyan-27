'use client'

import Link from 'next/link'
import { APP_NAME, APP_TAGLINE } from '@/lib/branding'

const STEPS = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Register with email verification — a 6-digit code is sent to confirm your address.',
  },
  {
    step: '02',
    title: 'Get allotted a date',
    description: 'An admin assigns you on the schedule calendar for your PI day.',
  },
  {
    step: '03',
    title: 'Send WhatsApp slots',
    description: 'Use PI-1 or PI-2 forms to message candidates with pre-filled details.',
  },
  {
    step: '04',
    title: 'Mark as completed',
    description: 'Once done for the day, mark scheduling complete from your dashboard.',
  },
]

const FEATURES = [
  {
    title: 'PI-1 & PI-2 scheduler',
    description: 'Pre-formatted WhatsApp messages with date, time, and venue.',
  },
  {
    title: 'Team allotments',
    description: 'See who is allotted on each day across the team.',
  },
  {
    title: 'Completion tracking',
    description: 'Admins and users can track pending vs completed scheduling.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">{APP_NAME}</p>
            <p className="text-sm font-semibold mt-0.5">{APP_TAGLINE}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-gray-400 border border-white/10 rounded-lg px-3 sm:px-4 py-2 hover:text-white hover:border-white/20 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg px-3 sm:px-4 py-2 hover:bg-[#f0d898] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <section className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="inline-block bg-[#1a1a2e] border border-[#e8c97d33] text-[#e8c97d] px-5 py-2 rounded-full text-sm font-medium tracking-wide mb-6">
            ✨ {APP_NAME}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-4">
            Schedule Pragyan Events PI{' '}
            <span className="text-[#e8c97d]">effortlessly</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
            The official tool for {APP_NAME} team members to allot dates, send WhatsApp
            slot confirmations, and track scheduling progress — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-xl px-8 py-3 text-sm hover:bg-[#f0d898] transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto border border-white/10 text-gray-300 rounded-xl px-8 py-3 text-sm hover:border-[#e8c97d44] hover:text-white transition-colors"
            >
              Sign in to dashboard
            </Link>
          </div>
        </section>

        <section className="mb-16 sm:mb-20">
          <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-6">How it works</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {STEPS.map(item => (
              <div
                key={item.step}
                className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 sm:p-6"
              >
                <p className="text-[#e8c97d] text-xs font-semibold tracking-widest mb-2">{item.step}</p>
                <h2 className="text-base font-semibold mb-2">{item.title}</h2>
                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-20">
          <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-6">Features</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map(item => (
              <div
                key={item.title}
                className="bg-[#12121f] border border-[#e8c97d22] rounded-2xl p-5 text-center"
              >
                <h3 className="text-sm font-semibold text-[#e8c97d] mb-2">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1a1a2e] border border-[#e8c97d33] rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Ready to get started?</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            New team members can register instantly. Admins can sign in to manage allotments and users.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#e8c97d] text-[#0f0f1a] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#f0d898] transition-colors"
            >
              Register as User
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-sm text-gray-400 border border-white/10 rounded-lg px-6 py-2.5 hover:text-white hover:border-white/20 transition-colors"
            >
              Sign in (User or Admin)
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-6">
        <p className="text-center text-xs text-gray-600">
          {APP_NAME} · {APP_TAGLINE}
        </p>
      </footer>
    </div>
  )
}
