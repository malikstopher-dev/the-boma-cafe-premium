import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'boma_admin_auth';
const KITCHEN_COOKIE = 'boma_kitchen_auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, role } = body;

    if (role === 'kitchen') {
      const kitchenPassword = process.env.KITCHEN_PASSWORD;
      if (!kitchenPassword) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      if (password !== kitchenPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      const cookieStore = await cookies();
      cookieStore.set(KITCHEN_COOKIE, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
      });
      return NextResponse.json({ success: true, role: 'kitchen' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set(ADMIN_COOKIE, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({ success: true, user: { id: '1', username: 'admin', email: 'admin@thebomacafe.co.za' } });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE);

    if (adminCookie?.value === 'true') {
      return NextResponse.json({
        authenticated: true,
        user: { id: '1', username: 'admin', email: 'admin@thebomacafe.co.za' }
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
