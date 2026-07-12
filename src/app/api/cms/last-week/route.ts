import { NextRequest, NextResponse } from 'next/server';
import { getLastWeekHighlight, saveLastWeekHighlight } from '@/lib/cms-supabase';
import { requireAdminOrKitchen } from '@/lib/auth/requireRole';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const highlight = await getLastWeekHighlight();
    return NextResponse.json(highlight);
  } catch (error) {
    console.error('Error reading last week highlight:', error);
    return NextResponse.json({ error: 'Failed to read highlight' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminOrKitchen(request)
  if (authError) return authError

  try {
    const highlight = await request.json();
    await saveLastWeekHighlight(highlight);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving last week highlight:', error);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}
