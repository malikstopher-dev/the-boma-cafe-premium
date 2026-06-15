import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_COOKIE = 'boma_admin_auth'
const KITCHEN_COOKIE = 'boma_kitchen_auth'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const KITCHEN_PASSWORD = process.env.KITCHEN_PASSWORD || ''

async function hashCookieValue(role: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${role}:${secret}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  const arr = Array.from(new Uint8Array(buf))
  return arr.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin/')) return NextResponse.next()

  // Allow login page (unauthenticated)
  if (pathname === '/admin/login') return NextResponse.next()

  // Protect /admin/kitchen with kitchen (or admin) cookie
  if (pathname === '/admin/kitchen') {
    const kitchenExpected = await hashCookieValue('kitchen', KITCHEN_PASSWORD)
    const adminExpected = await hashCookieValue('admin', ADMIN_PASSWORD)
    const kitchenCookie = request.cookies.get(KITCHEN_COOKIE)
    const adminCookie = request.cookies.get(ADMIN_COOKIE)

    const isKitchen = kitchenCookie?.value === kitchenExpected
    const isAdmin = adminCookie?.value === adminExpected

    if (!isKitchen && !isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // All other /admin/* routes require admin cookie
  const expected = await hashCookieValue('admin', ADMIN_PASSWORD)
  const adminCookie = request.cookies.get(ADMIN_COOKIE)

  if (!adminCookie?.value || adminCookie.value !== expected) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
