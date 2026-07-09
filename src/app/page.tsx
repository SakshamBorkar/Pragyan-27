'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/utils'
import LandingPage from '@/components/LandingPage'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const token = localStorage.getItem('pragyan_session')
        if (!token) {
          setChecking(false)
          return
        }

        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (res.ok && data.user) {
          const role = data.user.role
          router.push(role === 'admin' ? '/admin' : '/dashboard')
          return
        }
      } catch {
        // Ignore — show landing page
      }
      setChecking(false)
    }

    checkSession()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return <LandingPage />
}
