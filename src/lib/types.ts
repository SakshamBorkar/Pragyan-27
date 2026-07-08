export type UserRole = 'user' | 'admin'
export type LoginAs = UserRole

export interface UserRecord {
  id: number
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface PIAssignment {
  id: number
  user_id: number
  assigned_date: string
  created_at: string
  user?: Pick<UserRecord, 'id' | 'name' | 'email'>
}

export interface DateAssignments {
  date: string
  userIds: number[]
  users: Pick<UserRecord, 'id' | 'name' | 'email'>[]
}

export function homePathForRole(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/dashboard'
}

export function homePathForLoginAs(loginAs: LoginAs): string {
  return loginAs === 'admin' ? '/admin' : '/dashboard'
}

export function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-')
  return `${d}/${m}/${y}`
}

export function getDateRelativeLabel(dateKey: string): string | null {
  const selected = new Date(`${dateKey}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  selected.setHours(0, 0, 0, 0)

  if (selected.getTime() === today.getTime()) return 'Today'
  if (selected.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return null
}

export function formatAllottedDate(dateKey: string): string {
  const relative = getDateRelativeLabel(dateKey)
  const display = formatDisplayDate(dateKey)
  return relative ? `${display} (${relative})` : display
}

export function formatWeekday(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' })
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split('-').map(Number)
  return { year, month }
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}
