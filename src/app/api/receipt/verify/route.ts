import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const ref = formData.get('ref') as string
    let phone = formData.get('phone') as string

    if (!ref || !phone) {
      return new Response(
        `<!DOCTYPE html><html><body><script>alert('Missing ref or phone');history.back()</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    phone = phone.trim().replace(/\s+/g, '')
    const normalizedPhone = phone.startsWith('0') ? '+27' + phone.slice(1) : phone.startsWith('+27') ? phone : '+27' + phone.replace(/^27/, '')

    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .select('phone')
      .eq('order_ref', ref)
      .maybeSingle()

    if (error || !data) {
      return new Response(
        `<!DOCTYPE html><html><body><script>alert('Order not found');history.back()</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const storedPhone = (data.phone || '').trim().replace(/\s+/g, '')
    const normalizedStored = storedPhone.startsWith('0') ? '+27' + storedPhone.slice(1) : storedPhone.startsWith('+27') ? storedPhone : '+27' + storedPhone.replace(/^27/, '')

    if (normalizedPhone !== normalizedStored) {
      return new Response(
        `<!DOCTYPE html><html><body><script>alert('Phone number does not match this order');history.back()</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const redirectUrl = new URL(`/receipt/${ref}`, request.url)
    redirectUrl.searchParams.set('verified', 'true')
    return NextResponse.redirect(redirectUrl)
  } catch {
    return new Response(
      `<!DOCTYPE html><html><body><script>alert('Verification failed');history.back()</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}
