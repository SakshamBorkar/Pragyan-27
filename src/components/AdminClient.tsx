'use client'

import { useEffect, useState } from 'react'
import PanelNav from './PanelNav'
import ScheduleCalendar from './ScheduleCalendar'
import type { UserRecord, UserRole } from '@/lib/types'

interface Props {
  userName: string
  currentUserId: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Tab = 'schedule' | 'users'

export default function AdminClient({ userName, currentUserId }: Props) {
  const [tab, setTab] = useState<Tab>('schedule')
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadUsers() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to load users.')
        return
      }
      setUsers(data.users)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function updateRole(userId: number, role: UserRole) {
    setBusyId(userId)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update role.')
        return
      }
      setUsers(prev => prev.map(u => (u.id === userId ? data.user : u)))
    } catch {
      setError('Failed to update role.')
    } finally {
      setBusyId(null)
    }
  }

  async function deleteUser(userId: number, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return

    setBusyId(userId)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to delete user.')
        return
      }
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      setError('Failed to delete user.')
    } finally {
      setBusyId(null)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount = users.filter(u => u.role === 'user').length

  const tabClass = (t: Tab) =>
    t === tab
      ? 'text-[#e8c97d] border-[#e8c97d44] bg-[#e8c97d11]'
      : 'text-gray-400 border-white/10 hover:border-white/20 hover:text-white'

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <PanelNav userName={userName} active="admin" isAdmin />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('schedule')}
          className={`text-xs border rounded-lg px-4 py-2 transition-colors ${tabClass('schedule')}`}
        >
          PI Schedule
        </button>
        <button
          onClick={() => setTab('users')}
          className={`text-xs border rounded-lg px-4 py-2 transition-colors ${tabClass('users')}`}
        >
          Manage Users
        </button>
      </div>

      {error && tab === 'users' && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {tab === 'schedule' ? (
        <ScheduleCalendar users={users} />
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-6">
            Manage team members who can access the PI scheduler.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-semibold text-[#e8c97d]">{users.length}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Admins</p>
              <p className="text-3xl font-semibold">{adminCount}</p>
            </div>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Users</p>
              <p className="text-3xl font-semibold">{userCount}</p>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold">All users</h2>
              <button
                onClick={loadUsers}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="px-5 py-8 text-sm text-gray-500">Loading users…</p>
            ) : users.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-white/5">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-4">
                          <div className="font-medium">{user.name}</div>
                          {user.id === currentUserId && (
                            <span className="text-[10px] text-[#e8c97d]">You</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-400">{user.email}</td>
                        <td className="px-5 py-4">
                          <select
                            value={user.role}
                            disabled={busyId === user.id || (user.id === currentUserId && user.role === 'admin')}
                            onChange={e => updateRole(user.id, e.target.value as UserRole)}
                            className="bg-[#0f0f1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#e8c97d] disabled:opacity-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(user.created_at)}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            disabled={busyId === user.id || user.id === currentUserId}
                            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
