import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'

const ADMIN_COOKIE = 'boma_admin_auth'
const KITCHEN_COOKIE = 'boma_kitchen_auth'

export type Role = 'admin' | 'kitchen'

export interface Session {
  role: Role
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const KITCHEN_PASSWORD = process.env.KITCHEN_PASSWORD || ''

export function expectedCookieValue(role: Role): string {
  const secret = role === 'admin' ? ADMIN_PASSWORD : KITCHEN_PASSWORD
  return createHash('sha256').update(`${role}:${secret}`).digest('hex')
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const admin = cookieStore.get(ADMIN_COOKIE)
  const kitchen = cookieStore.get(KITCHEN_COOKIE)

  if (admin?.value && admin.value === expectedCookieValue('admin')) return { role: 'admin' }
  if (kitchen?.value && kitchen.value === expectedCookieValue('kitchen')) return { role: 'kitchen' }

  return null
}

export async function requireRole(role: Role): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.role !== role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function requireAnyRole(roles: Role[]): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!roles.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function assertAuthenticated(): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
