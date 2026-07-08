import bcrypt from 'bcryptjs'

const OTP_LENGTH = 6
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const MAX_SENDS_PER_WINDOW = 5
const SEND_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH
  const num = Math.floor(Math.random() * max)
  return String(num).padStart(OTP_LENGTH, '0')
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString()
}

export function isOtpExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}

export function sendWindowStart(): string {
  return new Date(Date.now() - SEND_WINDOW_MS).toISOString()
}

export { OTP_LENGTH, MAX_SENDS_PER_WINDOW }
