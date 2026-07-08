import { requireAdmin } from '@/lib/auth'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const session = await requireAdmin()

  return (
    <AdminClient
      userName={session.name}
      currentUserId={session.userId}
    />
  )
}
