import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const { data, error } = await getAdminClient()
    .from('staff_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { notification_id, user_id } = body

    if (!notification_id || !user_id) {
      return NextResponse.json({ error: 'notification_id and user_id required' }, { status: 400 })
    }

    const { error } = await getAdminClient()
      .from('staff_notifications')
      .update({ read: true })
      .eq('id', notification_id)
      .eq('user_id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
