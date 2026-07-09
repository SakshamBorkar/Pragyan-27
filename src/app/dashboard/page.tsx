'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/utils'
import DashboardClient from '@/components/DashboardClient'

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = localStorage.getItem('pragyan_session')
        if (!token) {
          router.push('/login')
          return
        }

        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (res.ok && data.user) {
          setSession(data.user)
        } else {
          localStorage.removeItem('pragyan_session')
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <DashboardClient
      userName={session.name}
      isAdmin={session.role === 'admin'}
    />
  )
}
