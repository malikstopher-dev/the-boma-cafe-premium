// POST /api/staff/pin-reset — Reset staff PIN (manager approval required)
// Body: { staff_id: string, manager_employee_id: string, manager_pin: string, new_pin: string }

import { NextRequest, NextResponse } from 'next/server'
import { verifyPin, setPin } from '@/lib/staff/auth'
import { logAudit } from '@/lib/staff/audit'
import { getAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staff_id, manager_employee_id, manager_pin, new_pin } = body

    if (!staff_id || !manager_employee_id || !manager_pin || !new_pin) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (new_pin.length < 4 || new_pin.length > 6 || !/^\d+$/.test(new_pin)) {
      return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 })
    }

    // Verify manager credentials
    const managerResult = await verifyPin(manager_employee_id, manager_pin)
    if (!managerResult.success || !managerResult.profile) {
      return NextResponse.json({ error: 'Manager authentication failed' }, { status: 401 })
    }

    const manager = managerResult.profile
    if (manager.role !== 'admin' && manager.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can reset PINs' }, { status: 403 })
    }

    // Set new PIN
    const success = await setPin(staff_id, new_pin)
    if (!success) {
      return NextResponse.json({ error: 'Failed to reset PIN' }, { status: 500 })
    }

    // Log the reset
    await logAudit({
      actorId: manager.id,
      actorName: manager.name,
      actorRole: manager.role,
      action: 'pin.reset',
      targetType: 'staff',
      targetId: staff_id,
      details: { manager_employee_id },
    })

    return NextResponse.json({ success: true, message: 'PIN reset successfully' })
  } catch (error) {
    console.error('[PIN Reset] Error:', error)
    return NextResponse.json({ error: 'PIN reset failed' }, { status: 500 })
  }
}
