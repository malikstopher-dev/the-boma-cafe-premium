import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_COOKIE = 'boma_admin_auth'
const KITCHEN_COOKIE = 'boma_kitchen_auth'

export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const admin = cookieStore.get(ADMIN_COOKIE)
  const kitchen = cookieStore.get(KITCHEN_COOKIE)

  if (admin?.value === 'true' || kitchen?.value === 'true') {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function requireAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(ADMIN_COOKIE)

  if (authCookie?.value === 'true') {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
