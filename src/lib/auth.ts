import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

export { homePathForRole } from '@/lib/types'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-me'
)

export const COOKIE_NAME = 'pragyan_session'

export interface SessionPayload {
  userId: number
  name: string
  email: string
  role: UserRole
}

export function normalizeRole(role: unknown): UserRole {
  return role === 'admin' ? 'admin' : 'user'
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const data = payload as Record<string, unknown>
    if (typeof data.userId !== 'number' || typeof data.name !== 'string' || typeof data.email !== 'string') {
      return null
    }
    return {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: normalizeRole(data.role),
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function isAdmin(session: SessionPayload | null): boolean {
  return session?.role === 'admin'
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession()
  if (!isAdmin(session)) redirect('/dashboard')
  return session
}
