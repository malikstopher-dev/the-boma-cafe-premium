import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/server-auth'
import { canTransition } from '@/lib/order-state-machine'

const VALID_ORDER_TYPES = ['pickup', 'delivery', 'dine-in']

async function generateOrderRef(): Promise<string | null> {
  try {
    const now = new Date()
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '')
    const { count } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
    const seq = (count ?? 0) + 1
    return `BOMA-${yymmdd}-${String(seq).padStart(3, '0')}`
  } catch {
    return null
  }
}

function validateItemsJson(value: string): boolean {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.every((i) => i.name && typeof i.quantity === 'number')
    if (parsed && Array.isArray(parsed.items)) return parsed.items.every((i: any) => i.name && typeof i.quantity === 'number')
    return false
  } catch {
    return false
  }
}

// Simple in-memory dedup window — prevents duplicate POST within 5s
const recentCreations = new Map<string, number>()
setInterval(() => {
  const cutoff = Date.now() - 10000
  for (const [key, ts] of Array.from(recentCreations.entries())) {
    if (ts < cutoff) recentCreations.delete(key)
  }
}, 10000)

function dedupKey(body: any): string {
  return `${body.customer_name}|${body.total}|${body.order_type}|${JSON.stringify(body.items_json).slice(0, 200)}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('order_ref')

  if (orderRef) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('order_ref, customer_name, total, status, created_at')
      .eq('order_ref', orderRef)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json(data)
  }

  const authError = await requireAuth()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, phone, order_type, requested_time, items_json, total } = body

    if (!customer_name || !phone || !order_type || !items_json || total === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_ORDER_TYPES.includes(order_type)) {
      return NextResponse.json({ error: `Invalid order type. Must be one of: ${VALID_ORDER_TYPES.join(', ')}` }, { status: 400 })
    }

    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json({ error: 'Invalid total' }, { status: 400 })
    }

    if (!validateItemsJson(items_json)) {
      return NextResponse.json({ error: 'Invalid items_json format' }, { status: 400 })
    }

    // Dedup: reject identical orders within 10s window
    const key = dedupKey(body)
    const last = recentCreations.get(key)
    if (last && Date.now() - last < 10000) {
      return NextResponse.json({ error: 'Duplicate order detected' }, { status: 429 })
    }
    recentCreations.set(key, Date.now())

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([{ customer_name, phone, order_type, requested_time, items_json, total, status: 'pending' }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const order_ref = await generateOrderRef()
    if (order_ref && data) {
      const { error: refError } = await supabaseAdmin
        .from('orders')
        .update({ order_ref })
        .eq('id', data.id)

      if (!refError) data.order_ref = order_ref
    }

    return NextResponse.json({ success: true, order: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Validate status transitions
    if (body.status) {
      // Fetch current order to validate transition
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError || !current) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Prevent transitions from completed/cancelled
      if (['completed', 'cancelled'].includes(current.status)) {
        return NextResponse.json({ error: `Cannot update a ${current.status} order` }, { status: 400 })
      }

      // Validate transition is allowed
      if (!canTransition(current.status as any, body.status as any)) {
        // Allow cancel from any active status
        if (body.status !== 'cancelled') {
          return NextResponse.json({ error: `Invalid transition: ${current.status} → ${body.status}` }, { status: 400 })
        }
      }

      // Prevent double-payment (already completed check)
      if (body.status === 'completed' && current.status === 'completed') {
        return NextResponse.json({ error: 'Order already completed' }, { status: 400 })
      }
    }

    const updateBody: Record<string, any> = { ...body }
    delete updateBody.id

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateBody)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
