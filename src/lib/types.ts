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
