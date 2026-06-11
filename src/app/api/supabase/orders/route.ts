import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/server-auth'

async function generateOrderRef(): Promise<string | null> {
  try {
    const now = new Date()
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '')

    const { count } = await supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())

    let seq = (count ?? 0) + 1
    return `BOMA-${yymmdd}-${String(seq).padStart(3, '0')}`
  } catch {
    return null
  }
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  }

  const authError = await requireAuth()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_name, phone, order_type, requested_time, items_json, total } = body

    if (!customer_name || !phone || !order_type || !items_json || total === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['pickup', 'delivery'].includes(order_type)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([{ customer_name, phone, order_type, requested_time, items_json, total, status: 'pending' }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const order_ref = await generateOrderRef()
    if (order_ref && data) {
      const { error: refError } = await supabaseAdmin
        .from('orders')
        .update({ order_ref })
        .eq('id', data.id)

      if (!refError) {
        data.order_ref = order_ref
      }
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

    const { error } = await supabaseAdmin
      .from('orders')
      .update(body)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
