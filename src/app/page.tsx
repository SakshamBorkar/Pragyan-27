import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { homePathForRole } from '@/lib/types'
import LandingPage from '@/components/LandingPage'

export default async function Home() {
  const session = await getSession()
  if (session) redirect(homePathForRole(session.role))
  return <LandingPage />
}
