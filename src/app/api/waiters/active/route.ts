import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await getAdminClient()
    .from('waiters')
    .select('id, name')
    .eq('active', true)
    .order('name')

  if (error) return NextResponse.json({ error: 'Failed to load waiters' }, { status: 500 })
  return NextResponse.json(data)
}
