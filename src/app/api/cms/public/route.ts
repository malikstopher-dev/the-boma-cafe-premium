import { NextResponse } from 'next/server';
import { getPublicCMSData } from '@/lib/cms-supabase';

export async function GET() {
  try {
    const data = await getPublicCMSData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading public data:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}
