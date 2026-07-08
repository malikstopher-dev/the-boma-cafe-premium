import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fcm_token, user_id } = body

    if (!fcm_token) {
      return NextResponse.json({ error: 'fcm_token required' }, { status: 400 })
    }

    // Deactivate rather than delete, so we keep history
    let query = getAdminClient()
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('fcm_token', fcm_token)

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
