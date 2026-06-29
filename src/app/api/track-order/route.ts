import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'

const STATUS_LABELS: Record<string, string> = {
  pending: 'New',
  confirmed: 'Accepted',
  preparing: 'Preparing',
  packing: 'Packing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const CORE_COLS = 'order_ref, customer_name, total, status, payment_status, order_type, created_at'
const OPTIONAL_COLS = 'waiter_name, table_number, preparation_time_minutes, items_json'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!checkRateLimit(`track:${ip}`)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')

  if (!ref) {
    return NextResponse.json({ error: 'Order reference required' }, { status: 400 })
  }

  // Try with optional columns first; if any column is missing, fall back to core only
  let data: Record<string, any> | null = null
  let { data: fullResult, error } = await getAdminClient()
    .from('orders')
    .select(`${CORE_COLS}, ${OPTIONAL_COLS}`)
    .eq('order_ref', ref)
    .maybeSingle()

  if (error && error.message?.includes('does not exist')) {
    const fallback = await getAdminClient()
      .from('orders')
      .select(CORE_COLS)
      .eq('order_ref', ref)
      .maybeSingle()
    fullResult = fallback.data as any
    error = fallback.error as any
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!fullResult) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  data = fullResult

  return NextResponse.json({
    order_ref: data.order_ref,
    customer_name: data.customer_name,
    total: data.total,
    status: data.status,
    payment_status: data.payment_status,
    order_type: data.order_type,
    waiter_name: data.waiter_name ?? null,
    table_number: data.table_number ?? null,
    preparation_time_minutes: data.preparation_time_minutes ?? null,
    items_json: data.items_json ?? null,
    status_label: STATUS_LABELS[data.status] || data.status,
    created_at: data.created_at,
  })
}
