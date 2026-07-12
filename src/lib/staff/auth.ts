// Staff Authentication — PIN hashing, verification, login logic
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { getAdminClient } from '@/lib/supabase'

const PIN_SALT_LENGTH = 16
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export interface StaffProfile {
  id: string
  user_id: string
  name: string
  role: 'admin' | 'kitchen' | 'waiter' | 'bar' | 'manager'
  employee_id: string | null
  pin_hash: string | null
  pin_salt: string | null
  pin_set_at: string | null
  pin_expires_at: string | null
  failed_attempts: number
  locked_until: string | null
  last_login_at: string | null
  on_duty: boolean
  online: boolean
  avatar_url: string | null
}

export function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex')
}

export function generateSalt(): string {
  return randomBytes(PIN_SALT_LENGTH).toString('hex')
}

export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function isLocked(profile: StaffProfile): boolean {
  if (!profile.locked_until) return false
  return new Date(profile.locked_until).getTime() > Date.now()
}

export function isPinExpired(profile: StaffProfile): boolean {
  if (!profile.pin_expires_at) return false
  return new Date(profile.pin_expires_at).getTime() < Date.now()
}

export async function getStaffByEmployeeId(employeeId: string): Promise<StaffProfile | null> {
  const { data, error } = await getAdminClient()
    .from('staff_profiles')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (error || !data) return null
  return data as StaffProfile
}

export async function getStaffById(id: string): Promise<StaffProfile | null> {
  const { data, error } = await getAdminClient()
    .from('staff_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as StaffProfile
}

export async function verifyPin(employeeId: string, pin: string): Promise<{ success: boolean; profile?: StaffProfile; error?: string }> {
  const profile = await getStaffByEmployeeId(employeeId)

  if (!profile) {
    return { success: false, error: 'Employee not found' }
  }

  if (isLocked(profile)) {
    const lockExpiry = new Date(profile.locked_until!).getTime()
    const remainingSeconds = Math.ceil((lockExpiry - Date.now()) / 1000)
    return { success: false, error: `Account locked. Try again in ${remainingSeconds} seconds.` }
  }

  if (!profile.pin_hash || !profile.pin_salt) {
    return { success: false, error: 'PIN not set. Contact manager.' }
  }

  if (isPinExpired(profile)) {
    return { success: false, error: 'PIN expired. Contact manager to reset.' }
  }

  const computedHash = hashPin(pin, profile.pin_salt)
  const isValid = timingSafeCompare(computedHash, profile.pin_hash)

  if (!isValid) {
    await incrementFailedAttempts(profile.id)
    return { success: false, error: 'Invalid PIN' }
  }

  // Reset failed attempts on success
  await resetFailedAttempts(profile.id)
  await updateLastLogin(profile.id)

  return { success: true, profile }
}

export async function setPin(staffId: string, pin: string): Promise<boolean> {
  const salt = generateSalt()
  const hash = hashPin(pin, salt)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days

  const { error } = await getAdminClient()
    .from('staff_profiles')
    .update({
      pin_hash: hash,
      pin_salt: salt,
      pin_set_at: now,
      pin_expires_at: expiresAt,
      failed_attempts: 0,
      locked_until: null,
    })
    .eq('id', staffId)

  return !error
}

export async function resetPinByManager(staffId: string, managerId: string, newPin: string): Promise<boolean> {
  const success = await setPin(staffId, newPin)
  if (success) {
    const { logAudit } = await import('./audit')
    await logAudit({
      actorId: managerId,
      action: 'pin.reset',
      targetType: 'staff',
      targetId: staffId,
    })
  }
  return success
}

async function incrementFailedAttempts(staffId: string): Promise<void> {
  const profile = await getStaffById(staffId)
  if (!profile) return

  const attempts = (profile.failed_attempts || 0) + 1
  const updates: Record<string, any> = { failed_attempts: attempts }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    updates.locked_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
    updates.failed_attempts = 0 // Reset after lockout
  }

  await getAdminClient()
    .from('staff_profiles')
    .update(updates)
    .eq('id', staffId)
}

async function resetFailedAttempts(staffId: string): Promise<void> {
  await getAdminClient()
    .from('staff_profiles')
    .update({ failed_attempts: 0, locked_until: null })
    .eq('id', staffId)
}

async function updateLastLogin(staffId: string): Promise<void> {
  await getAdminClient()
    .from('staff_profiles')
    .update({ last_login_at: new Date().toISOString(), online: true })
    .eq('id', staffId)
}
