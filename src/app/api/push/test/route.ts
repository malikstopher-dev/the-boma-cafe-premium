import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireRole'
import { sendToRole } from '@/lib/notifications/push'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { role } = body

    if (!role || !['admin', 'kitchen', 'waiter'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be one of: admin, kitchen, waiter' },
        { status: 400 },
      )
    }

    const result = await sendToRole(role, {
      title: '🔔 Test Notification',
      body: `This is a test push notification for ${role} role`,
      priority: 'high',
      data: {
        type: 'test',
        role,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      role,
      results: result,
      message: `Sent to ${result.sent} device(s), ${result.failed} failed`,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
