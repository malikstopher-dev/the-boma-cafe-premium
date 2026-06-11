import { NextRequest, NextResponse } from 'next/server';
import { getAnnouncement, saveAnnouncement } from '@/lib/db';
import { requireAuth } from '@/lib/server-auth';

export async function GET() {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const announcement = getAnnouncement();
    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error reading announcement:', error);
    return NextResponse.json({ error: 'Failed to read announcement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  try {
    const announcement = await request.json();
    const success = saveAnnouncement(announcement);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save announcement' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving announcement:', error);
    return NextResponse.json({ error: 'Failed to save announcement' }, { status: 500 });
  }
}