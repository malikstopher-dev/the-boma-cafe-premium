import { NextResponse, NextRequest } from 'next/server'

const ADMIN_COOKIE = 'boma_admin_auth'
const KITCHEN_COOKIE = 'boma_kitchen_auth'

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hasAdminCookie(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(ADMIN_COOKIE)
  if (!cookie?.value) return false
  const expected = await sha256('admin:' + (process.env.ADMIN_PASSWORD || ''))
  return cookie.value === expected
}

async function hasKitchenCookie(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(KITCHEN_COOKIE)
  if (!cookie?.value) return false
  const expected = await sha256('kitchen:' + (process.env.KITCHEN_PASSWORD || ''))
  return cookie.value === expected
}

async function hasAnyAuth(req: NextRequest): Promise<boolean> {
  return (await hasAdminCookie(req)) || (await hasKitchenCookie(req))
}

// Public API endpoints — these never require auth
const PUBLIC_API_PATHS = new Set([
  '/api/admin/auth',
  '/api/menu/public',
  '/api/cms/public',
  '/api/track-order',
])

// API paths where POST is public but other methods require auth
const PUBLIC_POST_ONLY_PATHS = new Set([
  '/api/supabase/orders',
  '/api/supabase/bookings',
  '/api/supabase/contact',
])

function isPublicApi(pathname: string, method: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true
  if (PUBLIC_POST_ONLY_PATHS.has(pathname) && method === 'POST') return true
  if (pathname.startsWith('/api/gallery/') && method === 'GET') return true
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method

  // Always allow static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/logo.png'
  ) {
    return NextResponse.next()
  }

  // Public API paths — allow through without auth
  if (pathname.startsWith('/api/') && isPublicApi(pathname, method)) {
    return NextResponse.next()
  }

  // /admin/login — always allow
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const anyAuth = await hasAnyAuth(req)
  const adminAuth = await hasAdminCookie(req)

  // /admin/kitchen — kitchen or admin (has its own PasswordGate)
  if (pathname.startsWith('/admin/kitchen')) {
    if (!anyAuth) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // /admin/* (everything except /admin/login and /admin/kitchen) — admin only
  if (pathname.startsWith('/admin/')) {
    if (!adminAuth) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // /waiter/* — any auth
  if (pathname.startsWith('/waiter')) {
    if (!anyAuth) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ALL non-public /api/* — require auth at firewall level
  if (pathname.startsWith('/api/')) {
    if (!anyAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/waiter/:path*',
    '/api/:path*',
  ],
}
