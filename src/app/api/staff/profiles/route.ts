import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = getAdminClient().from('staff_profiles').select('*')
  if (userId) query = query.eq('user_id', userId)
  else if (role === 'admin') {
    // Admin sees all
  } else {
    // Kitchen/waiter see all profiles
  }
  query = query.order('name')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { user_id, name, role: profileRole } = body

    if (!user_id || !name || !profileRole) {
      return NextResponse.json({ error: 'user_id, name, and role required' }, { status: 400 })
    }

    // Upsert profile
    const { data, error } = await getAdminClient()
      .from('staff_profiles')
      .upsert({ user_id, name, role: profileRole, online: true, last_seen: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { user_id, ...rest } = body
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const ALLOWED_FIELDS = ['name', 'online', 'last_seen', 'avatar_url', 'status_message']
    const updates: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in rest) {
        updates[key] = rest[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await getAdminClient()
      .from('staff_profiles')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
