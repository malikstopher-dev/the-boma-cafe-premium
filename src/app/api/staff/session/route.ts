// GET /api/staff/session — Check current session
// POST /api/staff/session — Refresh session
// DELETE /api/staff/session — Sign out

import { NextRequest, NextResponse } from 'next/server'
import { validateSession, endSession } from '@/lib/staff/session'
import { logAuthAudit } from '@/lib/staff/audit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('boma_staff_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false })
  }

  const session = await validateSession(sessionToken)

  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    staff: {
      id: session.staffId,
      name: session.name,
      role: session.role,
      employee_id: session.employeeId,
    },
    session: {
      started_at: session.startedAt,
      expires_at: session.expiresAt,
    },
  })
}

export async function POST(request: NextRequest) {
  // Refresh session — update last_active_at
  const sessionToken = request.cookies.get('boma_staff_session')?.value

  if (!sessionToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 })
  }

  const session = await validateSession(sessionToken)

  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    staff: {
      id: session.staffId,
      name: session.name,
      role: session.role,
      employee_id: session.employeeId,
    },
  })
}

export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get('boma_staff_session')?.value

  if (sessionToken) {
    await endSession(sessionToken, 'user_logout')

    // Get staff ID for audit
    const session = await validateSession(sessionToken).catch(() => null)
    if (session) {
      await logAuthAudit(session.staffId, 'auth.logout', {
        employee_id: session.employeeId,
      })
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('boma_staff_session', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('boma_waiter_auth', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('boma_kitchen_auth', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('boma_bar_auth', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('boma_admin_auth', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 })

  return response
}
