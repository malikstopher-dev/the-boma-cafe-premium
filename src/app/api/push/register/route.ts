import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fcm_token, user_id, device_type, app_version } = body

    if (!fcm_token || !user_id) {
      return NextResponse.json({ error: 'fcm_token and user_id required' }, { status: 400 })
    }

    const { data, error } = await getAdminClient()
      .from('push_subscriptions')
      .upsert(
        {
          user_id,
          role,
          fcm_token,
          device_type: device_type || null,
          app_version: app_version || null,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'fcm_token', ignoreDuplicates: false },
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
