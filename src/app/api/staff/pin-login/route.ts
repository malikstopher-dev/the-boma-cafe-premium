// POST /api/staff/pin-login — Staff PIN authentication
// Body: { employee_id: string, pin: string, device_name?: string }
// Returns: { success, session_token, staff: { id, name, role, employee_id } }

import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, getStaffByEmployeeId } from '@/lib/staff/auth'
import { createSession, generateDeviceFingerprint } from '@/lib/staff/session'
import { logAuthAudit } from '@/lib/staff/audit'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(`pin-login:${ip}`, 20)) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { employee_id, pin, device_name } = body

    if (!employee_id || !pin) {
      return NextResponse.json({ error: 'Employee ID and PIN are required' }, { status: 400 })
    }

    // Rate limit per employee ID
    if (!checkRateLimit(`pin-login:${employee_id}`, 10)) {
      return NextResponse.json({ error: 'Too many attempts for this employee. Try again later.' }, { status: 429 })
    }

    const result = await verifyPin(employee_id, pin)

    if (!result.success || !result.profile) {
      return NextResponse.json({ error: result.error || 'Invalid credentials' }, { status: 401 })
    }

    const profile = result.profile
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ip)

    // Create session
    const session = await createSession(
      profile,
      deviceFingerprint,
      device_name || 'Web Browser',
      userAgent,
      ip
    )

    if (!session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Log audit
    await logAuthAudit(profile.id, 'auth.login', {
      employee_id: profile.employee_id,
      device: device_name || 'Web Browser',
      ip,
    })

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      session_token: session.sessionId,
      staff: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        employee_id: profile.employee_id,
      },
    })

    response.cookies.set('boma_staff_session', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    })

    // Also set the role cookie for middleware compatibility
    const roleCookieMap: Record<string, string> = {
      waiter: 'boma_waiter_auth',
      kitchen: 'boma_kitchen_auth',
      bar: 'boma_bar_auth',
      admin: 'boma_admin_auth',
      manager: 'boma_admin_auth',
    }
    const cookieName = roleCookieMap[profile.role] || 'boma_waiter_auth'
    response.cookies.set(cookieName, session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[PIN Login] Error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
