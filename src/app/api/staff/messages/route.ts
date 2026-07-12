import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
  const before = searchParams.get('before')

  if (!conversationId) {
    return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })
  }

  let query = getAdminClient()
    .from('staff_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data || []).reverse())
}

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { conversation_id, sender_id, message, message_type, voice_url } = body

    if (!conversation_id || !sender_id) {
      return NextResponse.json({ error: 'conversation_id and sender_id required' }, { status: 400 })
    }

    if (!message && !voice_url) {
      return NextResponse.json({ error: 'message or voice_url required' }, { status: 400 })
    }

    const { data, error } = await getAdminClient()
      .from('staff_messages')
      .insert({
        conversation_id,
        sender_id,
        message: message || null,
        message_type: message_type || 'text',
        voice_url: voice_url || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Create notifications for other conversation members
    const { data: members } = await getAdminClient()
      .from('staff_conversation_members')
      .select('user_id')
      .eq('conversation_id', conversation_id)
      .neq('user_id', sender_id)

    if (members) {
      const notifications = members.map((m: any) => ({
        user_id: m.user_id,
        type: 'new_message',
        title: 'New Message',
        message: message || '🎤 Voice message',
        metadata: { conversation_id, sender_id },
      }))
      await getAdminClient().from('staff_notifications').insert(notifications)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
