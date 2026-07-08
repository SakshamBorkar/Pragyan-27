import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AllotmentsClient from '@/components/AllotmentsClient'

export default async function AllotmentsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <AllotmentsClient
      userName={session.name}
      isAdmin={session.role === 'admin'}
      currentUserId={session.userId}
    />
  )
}
