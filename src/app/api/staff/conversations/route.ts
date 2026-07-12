import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { getRequestRole } from '@/lib/auth/requireRole'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  let query = getAdminClient()
    .from('staff_conversations')
    .select(`
      *,
      members:staff_conversation_members(*),
      last_message:staff_messages(
        id, message, message_type, sender_id, created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query
      .filter('members.user_id', 'eq', userId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For each conversation, get last message and unread count
  const conversations = await Promise.all(
    (data || []).map(async (conv) => {
      const { data: msgs } = await getAdminClient()
        .from('staff_messages')
        .select('id, message, message_type, sender_id, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)

      let unread_count = 0
      if (userId) {
        const { count } = await getAdminClient()
          .from('staff_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null)
        unread_count = count || 0
      }

      return { ...conv, last_message: msgs?.[0] || null, unread_count }
    })
  )

  return NextResponse.json(conversations)
}

export async function POST(request: NextRequest) {
  const role = await getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { member_ids, title } = body

    if (!member_ids || !Array.isArray(member_ids) || member_ids.length < 2) {
      return NextResponse.json({ error: 'At least 2 member_ids required' }, { status: 400 })
    }

    // Check if a conversation with exactly these members already exists
    const { data: existing } = await getAdminClient()
      .from('staff_conversation_members')
      .select('conversation_id')
      .in('user_id', member_ids)

    if (existing && existing.length > 0) {
      const grouped = existing.reduce((acc: Record<string, number>, cm: any) => {
        acc[cm.conversation_id] = (acc[cm.conversation_id] || 0) + 1
        return acc
      }, {})

      for (const [convId, count] of Object.entries(grouped)) {
        if (count === member_ids.length) {
          // Check if all members match
          const { data: members } = await getAdminClient()
            .from('staff_conversation_members')
            .select('user_id')
            .eq('conversation_id', convId)

          const existingIds = (members || []).map((m: any) => m.user_id).sort()
          const requestedIds = [...member_ids].sort()
          if (JSON.stringify(existingIds) === JSON.stringify(requestedIds)) {
            const { data: conv } = await getAdminClient()
              .from('staff_conversations')
              .select('*')
              .eq('id', convId)
              .single()
            return NextResponse.json(conv)
          }
        }
      }
    }

    // Create new conversation
    const isGroup = member_ids.length > 2
    const { data: conv, error: convError } = await getAdminClient()
      .from('staff_conversations')
      .insert({ title: title || null, is_group: isGroup })
      .select()
      .single()

    if (convError) return NextResponse.json({ error: convError.message }, { status: 500 })

    // Add members
    const membersData = member_ids.map((uid: string) => ({
      conversation_id: conv.id,
      user_id: uid,
    }))

    const { error: memberError } = await getAdminClient()
      .from('staff_conversation_members')
      .insert(membersData)

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

    return NextResponse.json(conv)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
